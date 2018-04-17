// Inspired from https://github.com/immersive-web/cardboard-vr-display/blob/master/src/dpdb.js
import dpdb from './dpdb.json';
import headsets from './headsets';

const userAgent = navigator.userAgent || navigator.vendor || window.opera;

/* eslint-disable */
const isMobile =
  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
    userAgent
  ) ||
  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
    userAgent.substr(0, 4)
  );
/* eslint-enable */

const isIOS = /iPad|iPhone|iPod/.test(navigator.platform);

const isWebViewAndroid =
  userAgent.indexOf('Version') !== -1 &&
  userAgent.indexOf('Android') !== -1 &&
  userAgent.indexOf('Chrome') !== -1;

const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

const isFirefoxAndroid =
  userAgent.indexOf('Firefox') !== -1 && userAgent.indexOf('Android') !== -1;

const width =
  Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio;

const height =
  Math.min(window.screen.width, window.screen.height) * window.devicePixelRatio;

const hardware = { width, height };

// ----------------------------------------------------------------------------

function matchRules(rule, ua, screenWidth, screenHeight) {
  // We can only match 'ua' and 'res' rules, not other types like 'mdmh'
  // (which are meant for native platforms).
  if (!rule.ua && !rule.res) return false;

  // If our user agent string doesn't contain the indicated user agent string,
  // the match fails.
  if (rule.ua && ua.indexOf(rule.ua) < 0) return false;

  // If the rule specifies screen dimensions that don't correspond to ours,
  // the match fails.
  if (rule.res) {
    if (!rule.res[0] || !rule.res[1]) return false;
    const [resX, resY] = rule.res;

    // Compare min and max so as to make the order not matter, i.e., it should
    // be true that 640x480 == 480x640.
    if (
      Math.min(screenWidth, screenHeight) !== Math.min(resX, resY) ||
      Math.max(screenWidth, screenHeight) !== Math.max(resX, resY)
    ) {
      return false;
    }
  }

  return true;
}

// ----------------------------------------------------------------------------

/* eslint-disable no-continue */
function extractDeviceParameters() {
  for (let i = 0; i < dpdb.devices.length; i++) {
    const device = dpdb.devices[i];
    if (!device.rules) {
      console.warn(`Device[${i}] has no rules section.`);
      continue;
    }

    if (device.type !== 'ios' && device.type !== 'android') {
      console.warn(`Device[${i}] has invalid type.`);
      continue;
    }

    // See if this device is of the appropriate type.
    if (isIOS !== (device.type === 'ios')) {
      continue;
    }

    // See if this device matches any of the rules:
    let matched = false;
    for (let j = 0; j < device.rules.length; j++) {
      const rule = device.rules[j];
      if (matchRules(rule, userAgent, width, height)) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      continue;
    }

    // device.dpi might be an array of [ xdpi, ydpi] or just a scalar.
    hardware.xdpi = device.dpi[0] || device.dpi;
    hardware.ydpi = device.dpi[1] || device.dpi;
    hardware.bevelMm = device.bw;
  }
}
/* eslint-enable no-continue */

// Apply rules
extractDeviceParameters();

// ----------------------------------------------------------------------------

function getVRHeadset() {
  return new Promise((resolve, reject) => {
    const body = document.querySelector('body');
    const selector = document.createElement('select');
    selector.innerHTML = headsets
      .map((headset, idx) => `<option value="${idx}">${headset.label}</option>`)
      .join('');
    selector.style.zIndex = 1000;
    selector.style.position = 'absolute';
    selector.style.left = '50%';
    selector.style.top = '50%';
    selector.style.transform = 'translate(-50%, -50%)';
    selector.addEventListener('change', (e) => {
      body.removeChild(selector);
      resolve(headsets[Number(e.target.value)]);
    });
    body.appendChild(selector);
  });
}

// ----------------------------------------------------------------------------

export default {
  isMobile,
  isIOS,
  isWebViewAndroid,
  isSafari,
  isFirefoxAndroid,
  hardware,
  getVRHeadset,
};
