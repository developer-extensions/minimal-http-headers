import '../../assets/img/icon-34.png';
import '../../assets/img/icon-128.png';

const responses = {};

const setupListeners = () => {
  chrome.webRequest.onCompleted.addListener(
    (responseDetails) => {
      const { tabId } = responseDetails;
      if (!responses[tabId]) {
        responses[tabId] = {};
      }
      responses[tabId] = responseDetails;

      chrome.runtime.sendMessage({ msg: 'request_completed' }, () => {});
    },
    { urls: ['http://*/*', 'https://*/*'], types: ['main_frame'] },
    ['extraHeaders', 'responseHeaders']
  );

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === 'request_response') {
      const { tabId } = request.data;
      sendResponse(responses?.[tabId] || null);
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      const statusCode = responses?.[tabId]?.statusCode;
      if (statusCode !== undefined && statusCode !== 200) {
        chrome.browserAction.setBadgeText({
          text: `${statusCode}`,
          tabId: tabId,
        });
        chrome.browserAction.setBadgeBackgroundColor({
          color: statusCode < 400 ? '#1b5e20' : '#9d0208',
        });
      }
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    delete responses[tabId];
  });
};

setupListeners();
