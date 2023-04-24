/**
 * 本项目参考https://github.com/moyada/stealer.git
 * 使用nodejs对py进行重写
 * 部署于服务器发现快手对ip进行限制,目前只能在本地运行
 * 有能力更换ip的可以尝试部署到服务器
 */
const request = require('request');

const UserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
const MobileUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"

const kwaiCookie = "did=web_21abd05fcd4d41c2b7f8b46e6daa0ac4; didv=1671507055000; kpf=PC_WEB; kpn=KUAISHOU_VISION; clientid=3; Hm_lvt_ed0a6497a1fdcdb3cdca291a7692408d=1671507067; Hm_lvt_7afe580efa9cda86356bdea8077a83e7=1671507067; Hm_lvt_2f06440050c04107e4de7a8003748f65=1671507067; Hm_lpvt_ed0a6497a1fdcdb3cdca291a7692408d=1671599937; Hm_lpvt_2f06440050c04107e4de7a8003748f65=1671599937; Hm_lpvt_7afe580efa9cda86356bdea8077a83e7=1671599937"
const gifshowCookie = "did=web_bb1ea33bea104b81b6d918b78e86875c; _did=web_921644925A93B96"

const mobileHeaders = {
    Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Host: 'v.kuaishou.com',
    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="100", "Google Chrome";v="100"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
    cookie: kwaiCookie,
    'user-agent': MobileUserAgent,
};

const PCHeaders = {
    Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Host: 'www.kuaishou.com',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    cookie: kwaiCookie,
    'user-agent': MobileUserAgent,
};


function getUrl(text) {
    if (text.includes('kuaishouapp')) {
        const urls = text.match(/(?<=v.kuaishouapp.com\/s\/)\w+/i);
        if (urls) {
            return `https://v.kuaishouapp.com/s/${urls[0]}`;
        }
    } else if (text.includes('v.kuaishou.com')) {
        const urls = text.match(/(?<=v.kuaishou.com\/)\w+/i);
        if (urls) {
            return `https://v.kuaishou.com/${urls[0]}`;
        }
    } else if (text.includes('www.kuaishou.com')) {
        const urls = text.match(/(?<=www.kuaishou.com\/)f\/[\w|-]+|short-video\/\w+/i);
        if (urls) {
            return `https://www.kuaishou.com/${urls[0]}`;
        }
    }
    return null;
}
async function getInfo(url) {
    const share_url = getUrl(url);
    if (!share_url) return null;
    try {
        const headers = share_url.includes('www.kuaishou.com') ? PCHeaders : mobileHeaders;
        const options = {
            url: share_url,
            headers,
            method: 'GET',
            followRedirect: true
        }
        const res = await _request(options);
        const target = res.request.uri.href;
        if (target.includes('chenzhongtech')) {
            getMobileInfo(target)
        }
        else if (target.includes('gifshow')) {
            const photo_id = ref.match(/(?<=photo\/)\w+/)[0];
            getPCInfo(target, photo_id)
        } else {
            const photo_id = target.match(/(?<=short-video\/)\w+/)[0];
            const newTarget = target.replace('/short-video', 'https://m.gifshow.com/fw/photo');
            getPCInfo(newTarget, photo_id)
        }
    } catch (error) {
        console.log(error)
    }
}
function _request(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error)
            } else {
                resolve(response)
            }
        })
    })
}
async function getPCInfo(referer, photoId) {
    const headers = {
        "Host": "m.gifshow.com",
        "Origin": "https://m.gifshow.com",
        "Content-Type": "application/json",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Referer": referer,
        "user-agent": UserAgent,
        "Cookie": gifshowCookie,
    }
    const params = {
        "env": 'SHARE_VIEWER_ENV_TX_TRICK',
        "photoId": photoId,
        "h5Domain": "m.gifshow.com",
        "isLongVideo": false,
    }
    const param = referer.split('&');
    if (param.length > 1) {
        const query = param.reduce((acc, curr) => {
            const [key, value] = curr.split('=');
            acc[key] = value;
            return acc;
        }, {});
        Object.assign(params, query);
    }
    const options = {
        url: 'https://m.gifshow.com/rest/wd/photo/info?kpn=KUAISHOU_VISION&captchaToken=',
        headers,
        method: 'POST',
        body: JSON.stringify(params),
    }
    const res = await _request(options);
    console.log(res.body)
}
async function getMobileInfo(referer) {
    const headers = {
        "Host": "v.m.chenzhongtech.com",
        "Origin": "https://v.m.chenzhongtech.com",
        "Content-Type": "application/json",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Referer": referer,
        "user-agent": MobileUserAgent,
        "Cookie": kwaiCookie,
    }
    const query = referer.split('&').reduce((acc, curr) => {
        const [key, value] = curr.split('=');
        acc[key] = value;
        return acc;
    }, {});
    const param = {
        "env": 'SHARE_VIEWER_ENV_TX_TRICK',
        "photoId": query['photoId'],
        "shareToken": query['shareToken'],
        "shareObjectId": query['shareObjectId'],
        "shareResourceType": 'PHOTO_OTHER',
        "fid": query['fid'],
        "shareMethod": 'token',
        "shareChannel": 'share_copylink',
        "h5Domain": "v.m.chenzhongtech.com",
        "isLongVideo": false,
        "kpn": "KUAISHOU",
        "subBiz": "BROWSE_SLIDE_PHOTO",
    }
    const options = {
        url: 'https://v.m.chenzhongtech.com/rest/wd/photo/info?kpn=KUAISHOU&captchaToken=',
        headers,
        method: 'POST',
        body: JSON.stringify(param),
    }
    const resp = await _request(options);
    console.log(resp.body)
}
// getInfo('https://v.kuaishou.com/TxIclr "快手影视巨星计划 "快手影视淘金计划 该作品在快手被播放过300.8万次，点击链接，打开【快手】直接观看！') // 移动端分享
// getInfo('https://www.kuaishou.com/f/X-5KU0Yxb0eJk1w5') // PC分享
// getInfo('https://www.kuaishou.com/short-video/3x6i2d5kwa97ih2?streamSource=hotrank&trendingId=%E9%9F%A9%E7%BD%91%E6%B0%91%EF%BC%9A%E6%88%90%E4%B8%BA%E7%BE%8E%E5%9B%BD%E8%B5%B0%E7%8B%97%E6%98%AF%E8%80%BB%E8%BE%B1%E7%9A%84&area=brilliantxxunknown') // PC直接复制