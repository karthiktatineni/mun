import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 50,          // virtual users
  duration: '10s', // test duration
};

export default function () {
  http.get('http://192.168.0.112/');
  sleep(1);
}
