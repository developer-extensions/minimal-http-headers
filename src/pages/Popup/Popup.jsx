import React, { useEffect, useState, useCallback } from 'react';
import './Popup.css';

const prettifyURL = (urlString) => {
  const url = new URL(urlString);
  return `${url.origin}${url.pathname}`;
};

const Popup = () => {
  const [requestCompletedData, setRequestCompletedData] = useState(undefined);

  const sendRequestResponseMsg = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.runtime.sendMessage(
        {
          msg: 'request_response',
          data: { url: tabs[0].url, tabId: tabs[0].id },
        },
        (response) => {
          setRequestCompletedData(response);
        }
      );
    });
  }, []);

  useEffect(() => {
    sendRequestResponseMsg();
  }, [sendRequestResponseMsg]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.msg === 'request_completed') {
        sendRequestResponseMsg();
      }
    });
  }, [sendRequestResponseMsg]);

  const renderRequestData = () => {
    const { url, statusLine, responseHeaders } = requestCompletedData;
    const [protocol, status] = statusLine.split(' ');
    const integerStatus = parseInt(+status / 100, 10);
    const statusColor = (() => {
      switch (integerStatus) {
        case 1:
        case 2:
          return '#1bc943';
        case 3:
          return '#FF8C00';
        default:
          return '#f83245';
      }
    })();

    return (
      <>
        <div className="main_info">
          <h1>GET: {prettifyURL(url)}</h1>
          <h2>
            {protocol} <span style={{ color: statusColor }}>{status}</span>
          </h2>
        </div>

        <table>
          <tbody>
            {responseHeaders.map((header) => {
              const { name, value } = header;

              return (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{value.replaceAll(';', '\n')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  };
  return (
    requestCompletedData !== undefined && (
      <>
        {requestCompletedData !== null ? (
          renderRequestData()
        ) : (
          <div className="main_info">
            <h1>This tab is not supported</h1>
          </div>
        )}
      </>
    )
  );
};

export default Popup;
