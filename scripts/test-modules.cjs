/* global __dirname */
/* Node-only contract checks; loads actual TS sources without Expo/native runtime. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(
    this,
    request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request,
    ...args,
  );
};
for (const extension of ['.ts', '.tsx'])
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    module._compile(outputText, filename);
  };
const load = Module._load;
let clientUser;
let realSession;
const savedSession = new Map();
Module._load = function (request, ...args) {
  if (request === 'react-native') return { Platform: { OS: 'web' } };
  if (request === '@/core/storage') {
    return {
      STORAGE_KEYS: { accessToken: 'token', sessionUser: 'user' },
      secureStorage: {
        get: async (key) => savedSession.get(key) ?? null,
        getJSON: async (key) => savedSession.has(key) ? JSON.parse(savedSession.get(key)) : null,
        set: async (key, value) => { savedSession.set(key, value); },
        setJSON: async (key, value) => { savedSession.set(key, JSON.stringify(value)); },
        remove: async (key) => { savedSession.delete(key); },
      },
    };
  }
  if (request === '@/core/notifications') return { readRegisteredPushToken: async () => 'device-test-token' };
  if (request === '@/core/auth')
    return {
      session: {
        getToken: () => realSession ? realSession.getToken() : clientUser?.token,
        getState: () => realSession ? realSession.getState() : { status: 'signedIn' },
        signOut: async () => realSession?.signOut(),
      },
    };
  if (request === '@/core/config') return { env: { apiUrl: 'http://test/api/v1', apiTimeout: 1000 } };
  if (request === '@/shared/ui') return { toast: { error() {} } };
  if (request === '@/features/media')
    return load.call(this, path.join(root, 'src/features/media/api/answer-images.ts'), ...args);
  return load.call(this, request, ...args);
};
const { db, resetDb } = require('../src/mocks/db/store');
const { issueToken } = require('../src/mocks/core/auth');
const { handleMockRequest } = require('../src/mocks/server');
const {
  validateForm,
  questionVisible,
  serializeAnswers,
  canFill,
} = require('../src/shared/utils/clinical-form');
const { api } = require('../src/core/api/client');
const { managementApi, normalizeFacility } = require('../src/features/facilities/api/management-api');
const { recordsApi } = require('../src/features/medical-records/api/records-api');
const { patientsApi } = require('../src/features/patients/api/patients-api');
const { notificationsApi } = require('../src/features/notifications/api/notifications-api');
const { templatesApi } = require('../src/features/dynamic-form/api/templates-api');
const { evaluateBranching } = require('../src/features/dynamic-form/utils/branching');
const { questionSchemaForTemplate } = require('../src/features/dynamic-form/schemas');
const { uas7Api } = require('../src/features/uas7/api/uas7-api');
const { prescriptionsApi } = require('../src/features/prescriptions/api/prescriptions-api');
const { labsApi } = require('../src/features/labs/api/labs-api');
const { toApiDate } = require('../src/shared/utils/date');
async function request(userId, method, target, body) {
  const url = new URL(target, 'http://test');
  return handleMockRequest({
    method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers: userId ? { authorization: 'Bearer ' + issueToken(db.users.get(userId)) } : {},
    body,
  });
}
async function expect(user, method, target, body, code = '1000') {
  const result = await request(user, method, target, body);
  assert.equal(result.body.code, code, method + ' ' + target + ': ' + JSON.stringify(result.body));
  return result.body.data;
}
let checks = 0;
async function test(name, action) {
  resetDb();
  await action();
  checks++;
  console.log('PASS ' + name);
}
(async () => {
  await test('API client accepts 1000 and 1001, rejects business errors', async () => {
    for (const code of ['1000', '1001']) {
      global.fetch = async () => new Response(JSON.stringify({ code, message: 'OK', data: { id: 42 } }));
      assert.deepEqual(await api.post('/test', {}), { id: 42 });
    }
    global.fetch = async () =>
      new Response(JSON.stringify({ code: '4003', message: 'closed', data: {} }), { status: 400 });
    await assert.rejects(api.put('/test', {}), { code: '4003' });
  });
  await test('15 facility endpoints and normalized IDs', async () => {
    const branch = await expect(
      1,
      'POST',
      '/branches',
      { name: 'Cơ sở thử', address: 'Hà Nội', phone: '0243869999' },
      '1001',
    );
    const dept = await expect(1, 'POST', '/departments', { name: 'Khoa thử', branch_id: branch.id }, '1001');
    const room = await expect(1, 'POST', '/rooms', { name: 'Phòng thử', department_id: dept.id }, '1001');
    for (const [kind, row] of [
      ['branches', branch],
      ['departments', dept],
      ['rooms', room],
    ]) {
      assert.ok((await expect(1, 'GET', '/' + kind)).some((r) => r.id === row.id));
      assert.equal((await expect(1, 'GET', '/' + kind + '/' + row.id)).id, row.id);
      assert.equal((await expect(1, 'PUT', '/' + kind + '/' + row.id, { name: 'Đã sửa' })).name, 'Đã sửa');
    }
    await expect(1, 'DELETE', '/branches/' + branch.id, undefined, '2003');
    await expect(1, 'DELETE', '/departments/' + dept.id);
    assert.equal(db.rooms.get(room.id).department_id, null);
    await expect(1, 'PUT', '/rooms/' + room.id, { department_id: 1 });
    await expect(1, 'PUT', '/branches/' + branch.id, {}, '2001');
    await expect(1, 'POST', '/branches', { name: 'Cơ sở thử', address: 'HN', phone: 'bad' }, '2004');
    await expect(1, 'POST', '/branches', { name: 'Đã sửa', address: 'HN', phone: '0243869999' }, '2003');
    await expect(1, 'DELETE', '/rooms/' + room.id);
    await expect(1, 'DELETE', '/branches/' + branch.id);
    assert.equal(normalizeFacility({ id: '9', department_id: '2' }).id, 9);
    assert.equal(normalizeFacility({ id: '9', department_id: null }).department_id, null);
  });
  await test('facility foreign keys, staff restrictions, auth, atomic failure', async () => {
    await expect(1, 'DELETE', '/rooms/1', undefined, '2003');
    await expect(1, 'DELETE', '/branches/1', undefined, '2003');
    await expect(1, 'DELETE', '/departments/1', undefined, '2003');
    await expect(1, 'POST', '/departments', { name: 'Invalid', branch_id: 999 }, '2003');
    await expect(1, 'PUT', '/rooms/1', { department_id: 3 }, '2003');
    await expect(2, 'POST', '/branches', {}, '3102');
    await expect(15, 'DELETE', '/rooms/2', undefined, '3102');
    await expect(null, 'GET', '/branches', undefined, '3003');
    assert.equal(db.rooms.get(1).department_id, 1);
  });
  await test('department deletion detaches all rooms; workplace API still filters correctly', async () => {
    const d = await expect(1, 'POST', '/departments', { name: 'Khoa rỗng', branch_id: 1 }, '1001');
    for (let i = 0; i < 5; i++) await expect(1, 'POST', '/rooms', { name: 'Phòng ' + i, department_id: d.id }, '1001');
    assert.equal((await expect(2, 'GET', '/rooms?department_id=' + d.id)).length, 5);
    await expect(1, 'DELETE', '/departments/' + d.id);
    assert.equal([...db.rooms.values()].filter((r) => r.department_id === null).length, 5);
    assert.ok((await expect(2, 'GET', '/departments?branch_id=2')).every((d) => d.branch_id === 2));
  });
  await test('patient filters, exact single-year behavior and pagination', async () => {
    const result = await request(2, 'GET', '/doctor/patients/search?limit=5&page=1');
    assert.equal(result.body.data.length, 5);
    assert.equal(result.body.total, 26);
    const second = await expect(2, 'GET', '/doctor/patients/search?limit=5&page=2');
    assert.ok(!second.some((p) => result.body.data.some((r) => r.user_id === p.user_id)));
    assert.equal((await expect(2, 'GET', '/doctor/patients/search?keyword=0912345678'))[0].user_id, 15);
    assert.ok((await expect(2, 'GET', '/doctor/patients/search?keyword=nguyen')).length);
    for (const query of ['min_year=1990', 'max_year=1990', 'min_year=1990&max_year=1990']) {
      const rows = await expect(2, 'GET', '/doctor/patients/search?' + query);
      assert.ok(rows.length);
      assert.ok(rows.every((p) => p.year_of_birth === 1990));
    }
    const rows = await expect(2, 'GET', '/doctor/patients/search?gender=female&min_year=1970&max_year=2000');
    assert.ok(rows.every((p) => p.gender === 'female' && p.year_of_birth >= 1970 && p.year_of_birth <= 2000));
    await expect(2, 'GET', '/doctor/patients/search?min_year=2000&max_year=1990', undefined, '2003');
    await expect(15, 'GET', '/doctor/patients/search', undefined, '3103');
  });
  await test('patient creation, field validation, duplicate phone and permissions', async () => {
    const input = {
      full_name: 'Bệnh nhân mới',
      phone: '0933333333',
      password: '123456',
      gender: 'female',
      year_of_birth: 1999,
      next_of_kin_phone: '0944444444',
      health_insurance_validate: '2027-12-31',
    };
    const p = await expect(4, 'POST', '/doctor/patients/', input, '1001');
    assert.equal(p.year_of_birth, 1999);
    assert.equal(p.role_id, 3);
    assert.equal(p.is_active, 1);
    await expect(2, 'POST', '/doctor/patients', input, '3006');
    await expect(15, 'POST', '/doctor/patients', input, '3103');
    await expect(
      2,
      'POST',
      '/doctor/patients',
      { ...input, phone: '0944444444', health_insurance_validate: '2027-02-30' },
      '2006',
    );
    assert.equal(db.users.size, 32);
  });
  await test('classification and template read contracts', async () => {
    const questions = await expect(15, 'GET', '/medical_records/classify-questions');
    assert.ok(questions[0].options.length);
    await expect(15, 'POST', '/medical_records/classify', { answers: [] }, '4006');
    await expect(
      15,
      'POST',
      '/medical_records/classify',
      { answers: [{ question_id: 'Q_DURATION', option_value: 'bad' }] },
      '4006',
    );
    for (const value of ['acute', 'chronic']) {
      const result = await expect(15, 'POST', '/medical_records/classify', {
        answers: [{ question_id: 'Q_DURATION', option_value: value }],
      });
      const template = await expect(15, 'GET', '/templates/' + result.template_id);
      assert.equal(template.code_template, result.template_id);
      assert.ok(template.sections[0].questions.length);
    }
    await expect(15, 'GET', '/templates/missing', undefined, '4101');
  });
  await test('full patient -> doctor -> completed flow, answer upsert and read-only lock', async () => {
    const r = await expect(
      15,
      'POST',
      '/medical_records/',
      {
        template_id: 'TMPL_URT_ACUTE',
        patient_id: 17,
        answers: [{ question_id: 'Q_REASON', answer_text: 'Ngứa' }],
      },
      '1001',
    );
    assert.equal(r.patient_id, 15);
    assert.equal(r.status, 'pending');
    await expect(15, 'PUT', '/medical_records/' + r.medical_record_id + '/answers', {
      answers: [{ question_id: 'Q_REASON', answer_text: 'Đã cập nhật' }],
    });
    await expect(2, 'POST', '/medical_records/' + r.medical_record_id + '/accept');
    assert.equal(r.status, 'in_progress');
    await expect(3, 'POST', '/medical_records/' + r.medical_record_id + '/accept', undefined, '4005');
    await expect(2, 'POST', '/medical_records/' + r.medical_record_id + '/accept', undefined, '4004');
    await expect(
      15,
      'PUT',
      '/medical_records/' + r.medical_record_id + '/answers',
      { answers: [{ question_id: 'Q_REASON', answer_text: 'Late' }] },
      '3101',
    );
    await expect(3, 'PUT', '/medical_records/' + r.medical_record_id, { status: 'completed' }, '3105');
    for (const text of ['Lần 1', 'Lần 2'])
      await expect(2, 'PUT', '/medical_records/' + r.medical_record_id + '/answers', {
        answers: [{ question_id: 'Q_ASSESSMENT', answer_text: text }],
      });
    const answers = await expect(2, 'GET', '/medical_records/' + r.medical_record_id + '/answers');
    assert.equal(answers.filter((a) => a.question_id === 'Q_ASSESSMENT').length, 1);
    assert.equal(answers.find((a) => a.question_id === 'Q_REASON').answer_text, 'Đã cập nhật');
    await expect(2, 'PUT', '/medical_records/' + r.medical_record_id, {
      status: 'completed',
      instructions: 'Tái khám',
    });
    assert.ok(r.completed_at);
    assert.equal(r.instructions, 'Tái khám');
    await expect(2, 'PUT', '/medical_records/' + r.medical_record_id + '/answers', { answers: [] }, '4003');
    assert.equal(
      (await expect(15, 'GET', '/medical_records/' + r.medical_record_id + '/summary')).patient_name,
      'Nguyễn Văn A',
    );
  });
  await test('staff-created record retains patient and creator IDs; cancellation locks', async () => {
    const r = await expect(
      4,
      'POST',
      '/medical_records',
      { patient_id: 17, template_id: 'TMPL_URT_CHRONIC', answers: [] },
      '1001',
    );
    assert.equal(r.patient_id, 17);
    assert.equal(r.created_by, 4);
    await expect(4, 'POST', '/medical_records/' + r.medical_record_id + '/accept', undefined, '3103');
    await expect(2, 'POST', '/medical_records/' + r.medical_record_id + '/accept');
    await expect(2, 'PUT', '/medical_records/' + r.medical_record_id, {
      status: 'cancelled',
      instructions: 'Hủy ca',
    });
    await expect(2, 'PUT', '/medical_records/' + r.medical_record_id + '/answers', { answers: [] }, '4003');
  });
  await test('record visibility, filters and admin-only cascading deletion', async () => {
    await expect(15, 'GET', '/medical_records/patients/17/history', undefined, '3106');
    await expect(17, 'GET', '/medical_records/1', undefined, '3106');
    await expect(15, 'GET', '/medical_records/all', undefined, '3103');
    await expect(2, 'GET', '/medical_records/999', undefined, '4001');
    const history = await expect(15, 'GET', '/medical_records/patients/15/history?status=pending&limit=2');
    assert.ok(history.every((r) => r.status === 'pending' && r.patient_id === 15));
    assert.ok(
      (await expect(2, 'GET', '/medical_records/all?patient_id=15&status=completed')).every(
        (r) => r.patient_id === 15 && r.status === 'completed',
      ),
    );
    await expect(2, 'DELETE', '/medical_records/1', undefined, '3102');
    await expect(1, 'DELETE', '/medical_records/1/');
    assert.ok(![...db.answers.values()].some((a) => a.medical_record_id === 1));
    assert.equal(db.templates.size, 2);
    assert.ok(db.patients.has(15));
  });
  await test('answer validation rejects wrong template, wrong section, bad option and empty update', async () => {
    await expect(15, 'PUT', '/medical_records/1/answers', { answers: [] }, '4007');
    await expect(
      15,
      'PUT',
      '/medical_records/1/answers',
      { answers: [{ question_id: 'OTHER', answer_text: 'x' }] },
      '4008',
    );
    await expect(
      15,
      'PUT',
      '/medical_records/1/answers',
      { answers: [{ question_id: 'Q_ASSESSMENT', answer_text: 'x' }] },
      '3101',
    );
    await expect(
      15,
      'PUT',
      '/medical_records/1/answers',
      { answers: [{ question_id: 'Q_TRIGGER', question_option_id: 999 }] },
      '2003',
    );
    await expect(
      15,
      'PUT',
      '/medical_records/1/answers',
      { answers: [{ question_id: 'Q_ITCH', answer_value: { value: 'bad' } }] },
      '2003',
    );
    await expect(15, 'POST', '/medical_records', { template_id: 'missing' }, '4101');
  });
  await test('dynamic form dependencies, required fields, role sections and serialization', async () => {
    const template = db.templates.get('TMPL_URT_CHRONIC');
    const questions = template.sections.flatMap((s) => s.questions);
    const food = questions.find((q) => q.question_id === 'Q_FOOD');
    assert.equal(questionVisible(food, { Q_TRIGGER: [] }, questions), false);
    assert.equal(questionVisible(food, { Q_TRIGGER: ['food'] }, questions), true);
    assert.ok(validateForm(template, { Q_REASON: 'x', Q_TRIGGER: ['food'] }, 'patient').Q_FOOD);
    assert.deepEqual(validateForm(template, {}, 'doctor'), {});
    const payload = serializeAnswers(template, { Q_REASON: 'x', Q_TRIGGER: [], Q_FOOD: 'old' }, 'patient');
    assert.equal(payload.find((a) => a.question_id === 'Q_FOOD').answer_text, null);
    assert.ok(!payload.some((a) => a.question_id === 'Q_ASSESSMENT'));
    const cyclic = [
      { question_id: 'a', parent_question_id: 'b' },
      { question_id: 'b', parent_question_id: 'a' },
    ];
    assert.equal(questionVisible(cyclic[0], { a: 'yes', b: 'yes' }, cyclic), false);
    assert.equal(canFill('patdoc', 'patient'), true);
    assert.equal(canFill('patdoc', 'doctor'), true);
    assert.equal(canFill('patdoc', 'readonly'), false);
    const officialQuestions = [
      { question_id: 'Q_ITCH', type_question: 'radio' },
      {
        question_id: 'Q_ITCH_LEVEL',
        parent_question_id: 'Q_ITCH',
        show_if_answer: { option_values: ['YES'] },
        type_question: 'number',
      },
      {
        question_id: 'Q_ITCH_SLEEP',
        parent_question_id: 'Q_ITCH_LEVEL',
        condition_rules: {
          logic: 'AND',
          rules: [{ question_id: 'Q_ITCH_LEVEL', operator: 'gte', value: 7 }],
        },
        type_question: 'radio',
      },
    ];
    assert.equal(questionVisible(officialQuestions[1], { Q_ITCH: 'NO' }, officialQuestions), false);
    assert.equal(questionVisible(officialQuestions[1], { Q_ITCH: 'YES' }, officialQuestions), true);
    assert.equal(
      questionVisible(officialQuestions[2], { Q_ITCH: 'YES', Q_ITCH_LEVEL: 5 }, officialQuestions),
      false,
    );
    assert.equal(
      questionVisible(officialQuestions[2], { Q_ITCH: 'YES', Q_ITCH_LEVEL: 8 }, officialQuestions),
      true,
    );
  });
  await test('actual feature API adapters use the mock transport end-to-end', async () => {
    clientUser = { token: issueToken(db.users.get(1)) };
    global.fetch = async (url, options = {}) => {
      const parsed = new URL(url);
      const result = await handleMockRequest({
        method: options.method ?? 'GET',
        path: parsed.pathname.replace('/api/v1', ''),
        query: Object.fromEntries(parsed.searchParams),
        headers: Object.fromEntries(
          Object.entries(options.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
        ),
        body: options.body ? JSON.parse(options.body) : undefined,
      });
      return new Response(JSON.stringify(result.body), { status: result.status });
    };
    const b = await managementApi.create('branches', {
      name: 'API test',
      address: 'Hà Nội',
      phone: '0243869999',
    });
    assert.equal((await managementApi.detail('branches', b.id)).name, 'API test');
    clientUser = { token: issueToken(db.users.get(2)) };
    const p = await patientsApi.create({
      full_name: 'Adapter',
      phone: '0933333333',
      password: '123456',
      gender: null,
      year_of_birth: null,
    });
    assert.equal(
      (await patientsApi.search({ keyword: '0933333333', page: 1, limit: 20 })).items[0].user_id,
      p.user_id,
    );
    const r = await recordsApi.create({ patient_id: p.user_id, template_id: 'TMPL_URT_ACUTE', answers: [] });
    await recordsApi.accept(r.medical_record_id);
    await recordsApi.saveAnswers(r.medical_record_id, [{ question_id: 'Q_ASSESSMENT', answer_text: 'Good' }]);
    await recordsApi.update(r.medical_record_id, { status: 'completed', instructions: 'Done' });
    assert.equal((await recordsApi.detail(r.medical_record_id)).status, 'completed');
    assert.equal((await recordsApi.summary(r.medical_record_id)).patient_name, 'Adapter');
    clientUser = { token: issueToken(db.users.get(1)) };
    await recordsApi.remove(r.medical_record_id);
  });
  await test('notifications 5 APIs, ownership, read-all ordering and FCM token upsert', async () => {
    const page1 = await request(15, 'GET', '/notifications?page=1&limit=20');
    assert.equal(page1.body.code, '1000');
    assert.equal(page1.body.data.length, 20);
    assert.equal(page1.body.total, 25);
    assert.equal(page1.body.unread_count, 16);
    const first = page1.body.data[0];
    await expect(2, 'PUT', '/notifications/' + first.id, undefined, '3106');
    await expect(15, 'PUT', '/notifications/99999', undefined, '9102');
    const unread = page1.body.data.find((n) => n.is_read === 0);
    assert.equal((await expect(15, 'PUT', '/notifications/' + unread.id)).is_read, 1);
    assert.equal((await expect(15, 'PUT', '/notifications/read-all')).updated_count, 15);
    assert.equal((await request(15, 'GET', '/notifications?page=1&limit=20')).body.unread_count, 0);
    await expect(15, 'DELETE', '/notifications/' + unread.id);
    await expect(15, 'DELETE', '/notifications/' + unread.id, undefined, '9102');
    await expect(15, 'POST', '/notifications/register_token', { device_type: 'android' }, '9101');
    await expect(
      15,
      'POST',
      '/notifications/register_token',
      { fcm_token: 'tok_a', device_type: 'windows' },
      '2003',
    );
    const t1 = await expect(15, 'POST', '/notifications/register_token', {
      fcm_token: 'tok_a',
      device_type: 'Android',
    });
    const t2 = await expect(2, 'POST', '/notifications/register_token', {
      fcm_token: 'tok_a',
      device_type: 'ios',
    });
    assert.equal(t1.id, t2.id);
    assert.equal(t2.user_id, 2);
    const anotherDevice = await expect(2, 'POST', '/notifications/register_token', {
      fcm_token: 'tok_android_2',
      device_type: 'android',
    });
    assert.notEqual(t2.id, anotherDevice.id);
    await expect(2, 'POST', '/auth/logout', { fcm_token: 'tok_a' });
    assert.equal(db.user_fcm_tokens.has(t2.id), false);
    assert.equal(db.user_fcm_tokens.has(anotherDevice.id), true);
  });
  await test('dynamic form 11 APIs, dynamic RBAC, clinical compatibility, 4105 and condition_rules integrity', async () => {
    // Dynamic RBAC: nurse (4) lacks permission -> 3102; grant manage_templates (4) -> allowed
    await expect(4, 'POST', '/templates', { code_template: 'T_RBAC', name: 'RBAC' }, '3102');
    await expect(1, 'POST', '/role_permissions', { role_id: 4, permissions: [4] });
    const createdTmpl = await expect(4, 'POST', '/templates', {
      code_template: 'T_RBAC',
      name: 'Phiếu tùy biến',
    });
    assert.equal(createdTmpl.version, '1.0');
    await expect(4, 'POST', '/templates', { code_template: 'T_RBAC', name: 'Trùng' }, '4102');

    // Section + custom-coded Questions + condition_rules reference
    const sec = await expect(4, 'POST', '/templates/T_RBAC/sections', {
      title: 'Phần 1',
      order: 1,
      filled_by: 'patdoc',
    });
    const q1 = await expect(4, 'POST', '/templates/sections/' + sec.section_id + '/questions', {
      question_id: 'CUSTOM_CHOICE',
      question_text: 'Có triệu chứng?',
      type_question: 'radio',
      order: 1,
      is_required: 1,
      options: [
        { option_text: 'Có', option_value: 'CO', order: 1 },
        { option_text: 'Không', option_value: 'KHONG', order: 2 },
      ],
    });
    await expect(4, 'POST', '/templates/sections/' + sec.section_id + '/questions', {
      question_id: 'CUSTOM_DATE',
      question_text: 'Ngày khởi phát',
      type_question: 'date',
      order: 2,
      is_required: 1,
      condition_rules: {
        logic: 'AND',
        rules: [{ question_id: q1.question_id, operator: 'eq', value: 'CO' }],
      },
    });
    const treeBefore = await expect(4, 'GET', '/templates/T_RBAC');

    // Blocking incompatible edit on q1 while qDate depends on 'CO'
    const schemaCheck = questionSchemaForTemplate(treeBefore, sec.section_id, q1.question_id).safeParse({
      ...q1,
      placeholder: '',
      help_text: '',
      options: [
        {
          id: q1.options[1].id,
          option_text: 'Không',
          option_value: 'KHONG',
          order: 1,
          trigger_image_upload: 0,
        },
      ],
    });
    assert.equal(schemaCheck.success, false);
    await expect(
      4,
      'PUT',
      '/templates/questions/' + q1.question_id,
      { options: [{ id: q1.options[1].id, option_text: 'Không', option_value: 'KHONG', order: 1 }] },
      '2003',
    );

    // Deleting q1 cleans up dangling condition_rules in qDate
    await expect(4, 'DELETE', '/templates/questions/' + q1.question_id);
    const treeAfter = await expect(4, 'GET', '/templates/T_RBAC');
    const refreshedDate = treeAfter.sections[0].questions.find((q) => q.question_id === 'CUSTOM_DATE');
    assert.equal(refreshedDate.condition_rules, null);

    // Date support in clinical form validation/serialization
    assert.equal(Object.keys(validateForm(treeAfter, { CUSTOM_DATE: '2026-11-17' }, 'doctor')).length, 0);
    assert.ok(validateForm(treeAfter, { CUSTOM_DATE: '2026-02-30' }, 'doctor').CUSTOM_DATE);
    assert.equal(
      serializeAnswers(treeAfter, { CUSTOM_DATE: '2026-11-17' }, 'doctor')[0].answer_text,
      '2026-11-17',
    );

    // Legacy clinical template reads cleanly via builder API adapter; TMPL_USED protection via real medical_records
    clientUser = { token: issueToken(db.users.get(1)) };
    const legacyDetail = await templatesApi.getDetail('TMPL_URT_CHRONIC');
    assert.equal(legacyDetail.code_template, 'TMPL_URT_CHRONIC');
    assert.equal(typeof legacyDetail.sections[0].section_id, 'number');
    assert.deepEqual(
      legacyDetail.sections[0].questions.find((q) => q.question_id === 'Q_FOOD').show_if_answer,
      { option_values: ['food'] },
    );

    const demoDetail = await templatesApi.getDetail('TMPL_DEMO');
    assert.equal(evaluateBranching(demoDetail, { Q_ITCH: 'YES', Q_LEVEL: 8 }).visible.Q_SLEEP, true);
    assert.equal(evaluateBranching(demoDetail, { Q_ITCH: 'YES', Q_LEVEL: 5 }).visible.Q_SLEEP, false);

    await expect(1, 'DELETE', '/templates/TMPL_USED', undefined, '4105');
    await expect(4, 'DELETE', '/templates/T_RBAC');

    // Test notificationsApi client wrapper
    clientUser = { token: issueToken(db.users.get(15)) };
    const notifPage = await notificationsApi.list({ page: 1, limit: 10 });
    assert.equal(notifPage.total, 25);
    assert.equal(notifPage.unread_count, 16);
    for (const device_type of ['android', 'ios']) {
      const fcm_token = `test-fcm-${device_type}`;
      const registered = await notificationsApi.registerToken({ fcm_token, device_type });
      assert.equal(registered.user_id, 15);
      assert.equal(registered.fcm_token, fcm_token);
      assert.equal(registered.device_type, device_type);
    }
  });
  await test('uas7, prescriptions and labs contracts, permissions and adapters', async () => {
    const today = toApiDate(new Date());
    await expect(2, 'GET', '/uas7-scores/eligibility', undefined, '3104');
    const elig = await expect(15, 'GET', '/uas7-scores/eligibility');
    assert.equal(elig.eligible, true);
    assert.equal(elig.medical_record_id, 5);
    await expect(
      15,
      'POST',
      '/uas7-scores',
      { medical_record_id: 5, score_date: today, iss7: 4, hss7: 1 },
      '5003',
    );
    await expect(
      15,
      'POST',
      '/uas7-scores',
      { medical_record_id: 5, score_date: today, iss7: 1, hss7: -1 },
      '5004',
    );
    await expect(15, 'POST', '/uas7-scores', { medical_record_id: 5, iss7: 1, hss7: 1 }, '5005');
    await expect(
      15,
      'POST',
      '/uas7-scores',
      { medical_record_id: 3, score_date: today, iss7: 1, hss7: 1 },
      '5001',
    );
    const score = await expect(
      15,
      'POST',
      '/uas7-scores',
      { medical_record_id: 5, score_date: today, iss7: 2, hss7: 3 },
      '1001',
    );
    assert.equal(score.daily_score, 5);
    await expect(
      15,
      'POST',
      '/uas7-scores',
      { medical_record_id: 5, score_date: today, iss7: 1, hss7: 1 },
      '5002',
    );
    await expect(17, 'GET', '/uas7-scores/patient/15', undefined, '3106');
    assert.equal((await expect(15, 'GET', '/uas7-scores/patient/15')).length, 7);

    // Prescriptions & Labs permissions + business rules
    await expect(
      4,
      'POST',
      '/prescriptions',
      { medical_record_id: 5, items: [{ medicine_name: 'Loratadine' }] },
      '3103',
    );
    await expect(
      15,
      'POST',
      '/prescriptions',
      { medical_record_id: 5, items: [{ medicine_name: 'Loratadine' }] },
      '3103',
    );
    await expect(
      2,
      'POST',
      '/prescriptions',
      { medical_record_id: 3, items: [{ medicine_name: 'Loratadine' }] },
      '8003',
    );
    await expect(2, 'POST', '/prescriptions', { medical_record_id: 5, items: [] }, '8001');
    await expect(
      2,
      'POST',
      '/prescriptions',
      { medical_record_id: 5, items: [{ medicine_name: '  ' }] },
      '8002',
    );
    await expect(4, 'POST', '/lab-requests', { medical_record_id: 5, items: [{ test_name: 'IgE' }] }, '3103');
    await expect(2, 'POST', '/lab-requests', { medical_record_id: 5, items: [] }, '8101');
    await expect(2, 'POST', '/lab-requests', { medical_record_id: 5, items: [{ test_name: '' }] }, '8102');
    await expect(17, 'GET', '/prescriptions/3', undefined, '3106');
    await expect(17, 'GET', '/lab-results/3', undefined, '3106');

    // Feature API adapters end-to-end
    global.fetch = async (url, options = {}) => {
      const parsed = new URL(url);
      const result = await handleMockRequest({
        method: options.method ?? 'GET',
        path: parsed.pathname.replace('/api/v1', ''),
        query: Object.fromEntries(parsed.searchParams),
        headers: Object.fromEntries(
          Object.entries(options.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
        ),
        body: options.body ? JSON.parse(options.body) : undefined,
      });
      return new Response(JSON.stringify(result.body), { status: result.status });
    };
    clientUser = { token: issueToken(db.users.get(2)) };
    const createdRx = await prescriptionsApi.create({
      medical_record_id: 5,
      note: 'Tái khám sau 7 ngày',
      items: [{ medicine_name: 'Cetirizine 10mg', dosage: '10mg', frequency: '1 viên/tối' }],
    });
    assert.equal(createdRx.items[0].medicine_name, 'Cetirizine 10mg');
    assert.equal((await prescriptionsApi.listByRecord(5)).length, 1);

    const createdLab = await labsApi.createRequest({
      medical_record_id: 5,
      items: [{ test_name: 'CRP định lượng' }],
    });
    assert.equal(createdLab.items[0].test_name, 'CRP định lượng');
    assert.equal((await labsApi.getResults(5)).length, 2);

    clientUser = { token: issueToken(db.users.get(15)) };
    const uasElig = await uas7Api.checkEligibility();
    assert.equal(uasElig.eligible, true);
    assert.equal((await uas7Api.getHistory(15)).length, 7);
  });
  await require('./checks/media-lesions.cjs')({
    assert,
    test,
    expect,
    request,
    db,
    handleMockRequest,
    setClientUser: (id) => {
      clientUser = { token: issueToken(db.users.get(id)) };
    },
  });
  await require('./checks/auth-offline.cjs')({
    assert, test, db, expect, savedSession,
    setSession: (session) => { realSession = session; },
  });
  console.log('\n' + checks + ' contract scenarios passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
