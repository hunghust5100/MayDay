/* Contract/regression checks for media and lesion tracking. No native services required. */
const { Buffer } = require('node:buffer');
module.exports = async ({ assert, test, expect, request, db, handleMockRequest, setClientUser }) => {
  const { mediaApi } = require('../../src/features/media/api/media-api');
  const { lesionsApi } = require('../../src/features/lesions/api/lesions-api');
  const { syncAnswerImages } = require('../../src/features/media/api/answer-images');
  const {
    saveRecordImages,
    visibleRecordImages,
  } = require('../../src/features/medical-records/api/record-media');
  const { validateForm, serializeAnswers } = require('../../src/shared/utils/clinical-form');
  const image = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=',
    'base64',
  );
  const form = (fields = {}, type = 'image/png', bytes = image) => {
    const data = new FormData();
    data.append('file', new Blob([bytes], { type }), 'test.png');
    for (const [key, value] of Object.entries(fields)) data.append(key, String(value));
    return data;
  };
  const upload = (user = 15, fields = {}) =>
    expect(user, 'POST', '/image-attachments/upload', form(fields), '1001');
  const calls = [];
  let failLink = null;
  const transport = (user) => {
    setClientUser(user);
    global.fetch = async (url, options = {}) => {
      if (String(url).startsWith('data:'))
        return new Response(image, { headers: { 'Content-Type': 'image/png' } });
      const parsed = new URL(url);
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      const target = parsed.pathname.replace('/api/v1', '');
      calls.push({ path: target, method: options.method, body });
      if (target === '/answer-images' && options.method === 'POST' && body.attachment_id === failLink) {
        failLink = null;
        return new Response(
          JSON.stringify({ code: '9901', message: 'Simulated transient failure', data: {} }),
          { status: 500 },
        );
      }
      const result = await handleMockRequest({
        method: options.method ?? 'GET',
        path: target,
        query: Object.fromEntries(parsed.searchParams),
        headers: Object.fromEntries(
          Object.entries(options.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
        ),
        body,
      });
      return new Response(JSON.stringify(result.body), { status: result.status });
    };
    calls.length = 0;
  };
  await test('media multipart web/native, metadata, ownership and six API contracts', async () => {
    const first = await upload(15, {
      medical_record_id: '1',
      question_id: 'Q_REASON',
      category: 'answer',
      description: 'test metadata',
    });
    assert.equal(first.user_id, 15);
    assert.equal(first.medical_record_id, 1);
    assert.equal(first.description, 'test metadata');
    assert.match(first.file_url, /^data:image\/png;base64,/);
    const native = await expect(
      15,
      'POST',
      '/image-attachments/upload',
      {
        getParts: () => [
          { fieldName: 'file', uri: 'file:///mock-test.png', type: 'image/png', name: 'native.png' },
          { fieldName: 'category', string: 'lesion' },
        ],
      },
      '1001',
    );
    assert.equal(native.file_url, 'file:///mock-test.png');
    assert.equal((await expect(15, 'GET', '/image-attachments/user/15')).length, 2);
    await expect(17, 'GET', '/image-attachments/user/15', undefined, '3106');
    await expect(null, 'GET', '/image-attachments/user/15', undefined, '3003');
    await expect(2, 'GET', '/image-attachments/user/15');
    await expect(17, 'DELETE', '/image-attachments/' + first.id, undefined, '3106');
    const link = await expect(
      15,
      'POST',
      '/answer-images',
      { answer_id: '1', attachment_id: first.id },
      '1001',
    );
    await expect(15, 'POST', '/answer-images', { answer_id: '1', attachment_id: first.id }, '6006');
    const links = await expect(15, 'GET', '/answer-images/1');
    assert.equal(links[0].attachment.attachment_id, first.id);
    await expect(17, 'GET', '/answer-images/1', undefined, '3106');
    await expect(17, 'DELETE', '/answer-images/' + link.id, undefined, '3106');
    await expect(15, 'DELETE', '/answer-images/' + link.id);
    assert.ok(db.media_attachments.has(first.id));
    await expect(15, 'DELETE', '/image-attachments/' + first.id);
    await expect(15, 'DELETE', '/image-attachments/' + first.id, undefined, '6005');
  });
  await test('media validates file/size/count/record/question before persisting anything', async () => {
    const count = db.media_attachments.size;
    await expect(15, 'POST', '/image-attachments/upload', {}, '6001');
    await expect(1, 'POST', '/image-attachments/upload', form(), '3103');
    await expect(15, 'POST', '/image-attachments/upload', new FormData(), '6001');
    await expect(15, 'POST', '/image-attachments/upload', form({}, 'application/pdf'), '6002');
    await expect(
      15,
      'POST',
      '/image-attachments/upload',
      form({}, 'image/png', new Uint8Array(5 * 1024 * 1024 + 1)),
      '6003',
    );
    const multiple = form();
    multiple.append('file', new Blob([image], { type: 'image/png' }), 'second.png');
    await expect(15, 'POST', '/image-attachments/upload', multiple, '6004');
    await expect(17, 'POST', '/image-attachments/upload', form({ medical_record_id: '1' }), '3106');
    await expect(15, 'POST', '/image-attachments/upload', form({ medical_record_id: '3' }), '4003');
    await expect(
      15,
      'POST',
      '/image-attachments/upload',
      form({ medical_record_id: '1', question_id: 'missing' }),
      '4008',
    );
    await expect(15, 'POST', '/image-attachments/upload', form({ question_id: 'Q_REASON' }), '2003');
    assert.equal(db.media_attachments.size, count);
  });
  await test('all 13 lesion APIs, data normalization and foreign-key integrity', async () => {
    transport(15);
    const e = await lesionsApi.createEpisode({
      medical_record_id: 1,
      name: 'Đợt kiểm thử',
      occurred_at: '2026-11-20 09:30:00',
      context_tags: ['Sau ăn'],
      context_other: null,
      medication_name: 'Thuốc mẫu',
      medication_taken_ago: '2',
      medication_unit: 'hour',
      description: 'Test',
    });
    assert.equal(typeof e.episode_id, 'string');
    assert.deepEqual(e.context_tags, ['Sau ăn']);
    assert.ok((await lesionsApi.episodes(1)).some((row) => row.episode_id === e.episode_id));
    assert.equal((await lesionsApi.episode(e.episode_id)).name, 'Đợt kiểm thử');
    await lesionsApi.editEpisode(e.episode_id, {
      name: 'Đã sửa',
      occurred_at: null,
      context_tags: ['Vận động'],
      context_other: null,
      medication_name: null,
      medication_taken_ago: null,
      medication_unit: null,
      description: null,
    });
    const l = await lesionsApi.createLocation({
      episode_id: e.episode_id,
      body_part: 'Cánh tay phải',
      occurred_at: null,
      context_tags: [],
      context_other: null,
      medication_name: null,
      medication_take: null,
      medication_unit: null,
    });
    await lesionsApi.editLocation(l.lesion_location_id, {
      body_part: 'Đùi trái',
      occurred_at: null,
      context_tags: [],
      context_other: null,
      medication_name: null,
      medication_take: null,
      medication_unit: null,
    });
    assert.equal((await lesionsApi.locations(e.episode_id))[0].body_part, 'Đùi trái');
    const attachment = await mediaApi.upload({
      uri: 'data:image/png;base64,' + image.toString('base64'),
      name: 'progress.png',
      mimeType: 'image/png',
      size: image.length,
    });
    const p = await lesionsApi.createPhoto({
      episode_id: e.episode_id,
      location_id: l.lesion_location_id,
      attachment_id: attachment.id,
      taken_at: '2026-11-20 10:00:00',
      milestone: 'start',
      itch_score: 0,
      pain_score: 10,
      burn_score: null,
      hives_count: 0,
      local_auas: null,
      annotated_url: null,
    });
    assert.equal(p.itch_score, 0);
    assert.equal(p.pain_score, 10);
    assert.equal(p.hives_count, 0);
    assert.equal((await lesionsApi.photos(l.lesion_location_id))[0].attachment.file_url, attachment.file_url);
    await lesionsApi.editPhoto(p.photo_id, { ...p, milestone: 'peak', itch_score: 4 });
    const patch = calls.findLast((r) => r.method === 'PATCH' && r.path.includes('/milestone'));
    assert.equal(patch.body.attachment_id, undefined);
    assert.equal(patch.body.taken_at, undefined);
    assert.equal((await lesionsApi.photos(l.lesion_location_id))[0].milestone, 'peak');
    await lesionsApi.deletePhoto(p.photo_id);
    assert.equal((await lesionsApi.photos(l.lesion_location_id)).length, 0);
    assert.ok(db.media_attachments.has(attachment.id));
    await lesionsApi.deleteLocation(l.lesion_location_id);
    await lesionsApi.deleteEpisode(e.episode_id);
    await expect(15, 'GET', '/lesion-episodes/' + e.episode_id, undefined, '7001');
  });
  await test('lesion validation, closed records, role checks and failed-write atomicity', async () => {
    const attachment = await upload();
    const photo = {
      episode_id: '1',
      location_id: '1',
      attachment_id: attachment.id,
      milestone: 'start',
      itch_score: '5',
    };
    await expect(15, 'POST', '/lesion-episodes', { medical_record_id: '1', name: ' ' }, '7004');
    await expect(
      15,
      'POST',
      '/lesion-episodes',
      { medical_record_id: '1', name: 'Test', medication_unit: 'minute' },
      '2003',
    );
    await expect(15, 'POST', '/lesion-locations', { episode_id: '1', body_part: '' }, '7005');
    await expect(
      15,
      'POST',
      '/lesion-episodes',
      { medical_record_id: '1', name: 'Test', occurred_at: '2026-02-30 09:00' },
      '2006',
    );
    await expect(15, 'POST', '/lesion-photos', { ...photo, itch_score: '10.1' }, '7007');
    await expect(15, 'POST', '/lesion-photos', { ...photo, pain_score: '-1' }, '7007');
    await expect(15, 'POST', '/lesion-photos', { ...photo, milestone: 'bad' }, '7006');
    await expect(17, 'GET', '/lesion-episodes/1', undefined, '3106');
    await expect(17, 'POST', '/lesion-photos', photo, '3106');
    await expect(2, 'POST', '/lesion-episodes', { medical_record_id: '1', name: 'No' }, '3104');
    const other = await expect(
      15,
      'POST',
      '/lesion-episodes',
      { medical_record_id: '1', name: 'Other' },
      '1001',
    );
    await expect(15, 'POST', '/lesion-photos', { ...photo, episode_id: other.episode_id }, '2003');
    assert.equal(db.lesion_photos.size, 0);
    const p = await expect(15, 'POST', '/lesion-photos', photo, '1001');
    db.medical_records.get(1).status = 'completed';
    await expect(15, 'GET', '/lesion-episodes/1');
    await expect(15, 'GET', '/lesion-photos/location/1');
    for (const [method, target, body] of [
      ['PATCH', '/lesion-episodes/1', { name: 'Late' }],
      ['DELETE', '/lesion-episodes/1'],
      ['PATCH', '/lesion-locations/1', { body_part: 'Late' }],
      ['DELETE', '/lesion-locations/1'],
      ['POST', '/lesion-photos', photo],
      ['PATCH', '/lesion-photos/' + p.photo_id + '/milestone', { milestone: 'peak' }],
      ['DELETE', '/lesion-photos/' + p.photo_id],
      ['DELETE', '/image-attachments/' + attachment.id],
    ])
      await expect(15, method, target, body, '4003');
    assert.equal(db.lesion_episodes.get('1').name, 'Đợt nổi mẩn mẫu');
    assert.equal(db.lesion_photos.get(p.photo_id).milestone, 'start');
  });
  await test('cascade/delete rules preserve original files and protect readonly answers', async () => {
    const file = await upload();
    const link = await expect(
      15,
      'POST',
      '/answer-images',
      { answer_id: '1', attachment_id: file.id },
      '1001',
    );
    const photo = await expect(
      15,
      'POST',
      '/lesion-photos',
      { episode_id: '1', location_id: '1', attachment_id: file.id, milestone: 'start' },
      '1001',
    );
    await expect(15, 'DELETE', '/lesion-locations/1');
    assert.ok(!db.lesion_photos.has(photo.photo_id));
    assert.ok(db.media_attachments.has(file.id));
    assert.ok(db.answer_images.has(link.id));
    db.medical_records.get(1).status = 'in_progress';
    db.medical_records.get(1).assigned_doctor_id = 2;
    await expect(15, 'DELETE', '/image-attachments/' + file.id, undefined, '3101');
    await expect(2, 'DELETE', '/answer-images/' + link.id, undefined, '3101');
    db.medical_records.get(1).status = 'pending';
    await expect(15, 'DELETE', '/image-attachments/' + file.id);
    assert.ok(!db.answer_images.has(link.id));
    const retained = await upload(15, { medical_record_id: '1' });
    await expect(1, 'DELETE', '/medical_records/1');
    assert.ok(!db.lesion_episodes.has('1'));
    assert.equal(db.media_attachments.get(retained.id).medical_record_id, null);
  });
  await test('image requirements, section permissions and record completion guard', async () => {
    const template = {
      code_template: 'TMPL_IMAGE_CHECK',
      name: 'Image validation',
      sections: [
        {
          section_id: 'p',
          title: 'Patient',
          filled_by: 'patient',
          questions: [
            {
              question_id: 'Q_IMAGE',
              question_text: 'Photo',
              type_question: 'image_upload',
              is_required: '1',
            },
            {
              question_id: 'Q_OPTION_IMAGE',
              question_text: 'Option',
              type_question: 'radio',
              options: [{ id: 999, option_value: 'yes', option_text: 'Yes', trigger_image_upload: '1' }],
            },
          ],
        },
        {
          section_id: 'd',
          title: 'Doctor',
          filled_by: 'doctor',
          questions: [{ question_id: 'Q_DOCTOR', question_text: 'Note', type_question: 'text' }],
        },
      ],
    };
    db.templates.set(template.code_template, template);
    assert.ok(validateForm(template, {}, 'patient', { images: {} }).Q_IMAGE);
    assert.ok(validateForm(template, { Q_OPTION_IMAGE: 'yes' }, 'patient', { images: {} }).Q_OPTION_IMAGE);
    const payload = serializeAnswers(template, { Q_OPTION_IMAGE: 'yes' }, 'patient', {});
    assert.ok(payload.some((a) => a.question_id === 'Q_IMAGE'));
    const r = await expect(
      15,
      'POST',
      '/medical_records',
      { template_id: template.code_template, answers: payload },
      '1001',
    );
    const answers = await expect(15, 'GET', '/medical_records/' + r.medical_record_id + '/answers');
    const a = answers.find((a) => a.question_id === 'Q_IMAGE');
    const a2 = answers.find((a) => a.question_id === 'Q_OPTION_IMAGE');
    const file = await upload();
    await expect(15, 'POST', '/answer-images', { answer_id: String(a.id), attachment_id: file.id }, '1001');
    await expect(
      15,
      'POST',
      '/answer-images',
      { answer_id: String(a2.id), attachment_id: file.id, option_value: 'missing' },
      '2003',
    );
    const file2 = await upload();
    await expect(
      15,
      'POST',
      '/answer-images',
      { answer_id: String(a2.id), attachment_id: file2.id, option_value: 'yes' },
      '1001',
    );
    assert.deepEqual(
      validateForm(template, { Q_OPTION_IMAGE: 'yes' }, 'patient', {
        images: {
          Q_IMAGE: [{ attachment_id: file.id }],
          Q_OPTION_IMAGE: [{ attachment_id: file2.id, option_value: 'yes' }],
        },
      }),
      {},
    );
    await expect(2, 'POST', '/medical_records/' + r.medical_record_id + '/accept');
    await expect(2, 'PUT', '/medical_records/' + r.medical_record_id, { status: 'completed' });
    await expect(15, 'DELETE', '/image-attachments/' + file.id, undefined, '4003');
  });
  await test('partial image linking retries safely and unchanged saves send zero media requests', async () => {
    transport(15);
    const first = await upload();
    const second = await upload();
    const desired = [
      { attachment_id: first.id, file_url: first.file_url },
      { attachment_id: second.id, file_url: second.file_url },
    ];
    failLink = second.id;
    await assert.rejects(syncAnswerImages(1, desired), { code: '9901' });
    assert.equal(db.answer_images.size, 1);
    await syncAnswerImages(1, desired);
    assert.equal(db.answer_images.size, 2);
    await syncAnswerImages(1, desired);
    assert.equal(db.answer_images.size, 2);
    const template = db.templates.get('TMPL_URT_CHRONIC');
    calls.length = 0;
    await saveRecordImages(1, template, { Q_REASON: 'Text' }, { Q_REASON: desired }, 'patient', {
      Q_REASON: desired,
    });
    assert.equal(calls.length, 0);
    await saveRecordImages(1, template, { Q_REASON: 'Text' }, { Q_REASON: [] }, 'patient', {
      Q_REASON: desired,
    });
    assert.equal(db.answer_images.size, 0);
    assert.equal(db.media_attachments.size, 2);
    const visible = visibleRecordImages(template, { Q_TRIGGER: [] }, { Q_FOOD: desired });
    assert.deepEqual(visible.Q_FOOD, []);
  });
};
