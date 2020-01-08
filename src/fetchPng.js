import { PNG } from 'pngjs';
import request from 'request';

export default async function fetchPng(url) {
  return new Promise((resolve, reject) => {
    request({
      url,
    })
      .on('error', (e) => {
        reject(e);
      })
      .pipe(new PNG())
      .on('parsed', function handleParsed() {
        resolve(this);
      });
  });
}
