// Public API: feature kho ảnh & ảnh đính kèm
export { MediaScreen } from './screens/MediaScreen';
export { mediaApi } from './api/media-api';
export { AttachmentPicker } from './components/AttachmentPicker';
export { QuestionImageField } from './components/QuestionImageField';
export { useRecordImages, syncAnswerImages } from './hooks/useMedia';
export type { MediaAttachment, UploadContext } from './types';
export { sameImageSet } from './api/answer-images';
