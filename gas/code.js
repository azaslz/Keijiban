const SCRIPT_PROPERTY_KEY = 'KEIJIBAN_MESSAGES';
const MAX_MESSAGES = 100;

function doGet(e) {
  const mode = (e.parameter.mode || 'list').toLowerCase();
  const callback = e.parameter.callback;

  switch (mode) {
    case 'list':
      return sendJson({ status: 'ok', messages: getMessages() }, callback);
    case 'post':
      return sendJson(postMessage(e.parameter.name, e.parameter.message), callback);
    default:
      return sendJson({ status: 'error', message: 'Unknown mode. Use mode=list or mode=post.' }, callback);
  }
}

function getMessages() {
  const raw = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEY);
  try {
    const messages = raw ? JSON.parse(raw) : [];
    return Array.isArray(messages) ? messages : [];
  } catch (err) {
    return [];
  }
}

function postMessage(name, message) {
  const author = normalizeText(name) || '匿名';
  const body = normalizeText(message);

  if (!body) {
    return { status: 'error', message: 'メッセージを入力してください。' };
  }

  const messages = getMessages();
  const item = {
    id: Date.now().toString(),
    author,
    body,
    createdAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  };

  messages.unshift(item);
  if (messages.length > MAX_MESSAGES) {
    messages.length = MAX_MESSAGES;
  }

  PropertiesService.getScriptProperties().setProperty(SCRIPT_PROPERTY_KEY, JSON.stringify(messages));
  return { status: 'ok', message: '投稿しました。', item };
}

function normalizeText(value) {
  return (value || '').toString().trim().slice(0, 500);
}

function sendJson(payload, callback) {
  if (callback) {
    const textOutput = ContentService.createTextOutput(`${callback}(${JSON.stringify(payload)});`);
    textOutput.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return textOutput;
  }

  const textOutput = ContentService.createTextOutput(JSON.stringify(payload));
  textOutput.setMimeType(ContentService.MimeType.JSON);
  return textOutput;
}
