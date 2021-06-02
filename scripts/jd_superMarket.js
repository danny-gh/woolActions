/*
东东超市
Last Modified time: 2021-3-4 21:22:37
活动入口：京东APP首页-京东超市-底部东东超市
Some Functions Modified From https://github.com/Zero-S1/JD_tools/blob/master/JD_superMarket.py
东东超市兑换奖品请使用此脚本 https://gitee.com/lxk0301/jd_scripts/raw/master/jd_blueCoin.js
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
=================QuantumultX==============
[task_local]
#东东超市
11 * * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_superMarket.js, tag=东东超市, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jxc.png, enabled=true
===========Loon===============
[Script]
cron "11 * * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_superMarket.js,tag=东东超市
=======Surge===========
东东超市 = type=cron,cronexp="11 * * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_superMarket.js
==============小火箭=============
东东超市 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_superMarket.js, cronexpr="11 * * * *", timeout=3600, enable=true
 */
const $ = new Env('东东超市');
//Node.js用户请在jdCookie.js处填写京东ck;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', jdSuperMarketShareArr = [], notify, newShareCodes;

let jdNotify = true;//用来是否关闭弹窗通知，true表示关闭，false表示开启。
let superMarketUpgrade = true;//自动升级,顺序:解锁升级商品、升级货架,true表示自动升级,false表示关闭自动升级
let businessCircleJump = true;//小于对方300热力值自动更换商圈队伍,true表示运行,false表示禁止
let drawLotteryFlag = false;//是否用500蓝币去抽奖，true表示开启，false表示关闭。默认关闭
let joinPkTeam = true;//是否自动加入PK队伍
let message = '', subTitle;
const JD_API_HOST = 'https://api.m.jd.com/api';

//助力好友分享码
//此此内容是IOS用户下载脚本到本地使用，填写互助码的地方，同一京东账号的好友互助码请使用@符号隔开。
//下面给出两个账号的填写示例（iOS只支持2个京东账号）
let shareCodes = [ // IOS本地脚本用户这个列表填入你要助力的好友的shareCode
  //账号一的好友shareCode,不同好友的shareCode中间用@符号隔开
  'Ihsza-6yZP8u7GvRy3MU3g@Ih4-bOmxZv8v-Wi6iw@9YWMtUcosWudJONU@95OxuU0Ss1qcJeZTH_uV@eU9YaOi6NPx19WfUwyYa1A@eU9Yae_hYK0m9maDniYR1g@eU9YM6v7N7Zbig-2jCV3',
  //账号二的好友shareCode,不同好友的shareCode中间用@符号隔开
  'Ihsza-6yZP8u7GvRy3MU3g@Ih4-bOmxZv8v-Wi6iw@9YWMtUcosWudJONU@95OxuU0Ss1qcJeZTH_uV@eU9YaOi6NPx19WfUwyYa1A@eU9Yae_hYK0m9maDniYR1g@eU9YM6v7N7Zbig-2jCV3',
]

!(async () => {
  await requireConfig();
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
      $.index = i + 1;
      $.coincount = 0;//收取了多少个蓝币
      $.coinerr = "";
      $.blueCionTimes = 0;
      $.isLogin = true;
      $.nickName = '';
      await TotalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      message = '';
      subTitle = '';
      //await shareCodesFormat();//格式化助力码
      await jdSuperMarket();
      await showMsg();
      // await businessCircleActivity();
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })
async function jdSuperMarket() {
  try {
    await receiveGoldCoin();//收金币
    await businessCircleActivity();//商圈活动
    await receiveBlueCoin();//收蓝币（小费）
    // await receiveLimitProductBlueCoin();//收限时商品的蓝币
    await daySign();//每日签到
    await BeanSign()//
    await doDailyTask();//做日常任务，分享，关注店铺，
    // await help();//商圈助力
    //await smtgQueryPkTask();//做商品PK任务
    await drawLottery();//抽奖功能(招财进宝)
    // await myProductList();//货架
    // await upgrade();//升级货架和商品
    // await manageProduct();
    // await limitTimeProduct();
    await smtg_shopIndex();
    await smtgHome();
    await receiveUserUpgradeBlue();
    await Home();
  } catch (e) {
    $.logErr(e)
  }
}
function showMsg() {
  $.log(`【京东账号${$.index}】${$.nickName}\n${message}`);
  jdNotify = $.getdata('jdSuperMarketNotify') ? $.getdata('jdSuperMarketNotify') : jdNotify;
  if (!jdNotify || jdNotify === 'false') {
    $.msg($.name, subTitle ,`【京东账号${$.index}】${$.nickName}\n${message}`);
  }
}
//抽奖功能(招财进宝)
async function drawLottery() {
  console.log(`\n注意⚠:东东超市抽奖已改版,花费500蓝币抽奖一次,现在脚本默认已关闭抽奖功能\n`);
  drawLotteryFlag = $.getdata('jdSuperMarketLottery') ? $.getdata('jdSuperMarketLottery') : drawLotteryFlag;
  if ($.isNode() && process.env.SUPERMARKET_LOTTERY) {
    drawLotteryFlag = process.env.SUPERMARKET_LOTTERY;
  }
  if (`${drawLotteryFlag}` === 'true') {
    const smtg_lotteryIndexRes = await smtg_lotteryIndex();
    if (smtg_lotteryIndexRes && smtg_lotteryIndexRes.data.bizCode === 0) {
      const { result } = smtg_lotteryIndexRes.data
      if (result.blueCoins > result.costCoins && result.remainedDrawTimes > 0) {
        const drawLotteryRes = await smtg_drawLottery();
        console.log(`\n花费${result.costCoins}蓝币抽奖结果${JSON.stringify(drawLotteryRes)}`);
        await drawLottery();
      } else {
        console.log(`\n抽奖失败:已抽奖或者蓝币不足`);
        console.log(`失败详情：\n现有蓝币:${result.blueCoins},抽奖次数:${result.remainedDrawTimes}`)
      }
    }
  } else {
    console.log(`设置的为不抽奖\n`)
  }
}
async function help() {
  return
  console.log(`\n开始助力好友`);
  for (let code of newShareCodes) {
    if (!code) continue;
    const res = await smtgDoAssistPkTask(code);
    console.log(`助力好友${JSON.stringify(res)}`);
  }
}
async function doDailyTask() {
  const smtgQueryShopTaskRes = await smtgQueryShopTask();
  if (smtgQueryShopTaskRes.code === 0 && smtgQueryShopTaskRes.data.success) {
    const taskList = smtgQueryShopTaskRes.data.result.taskList;
    console.log(`\n日常赚钱任务       完成状态`)
    for (let item of taskList) {
      console.log(` ${item['title'].length < 4 ? item['title']+`\xa0` : item['title'].slice(-4)}         ${item['finishNum'] === item['targetNum'] ? '已完成':'未完成'} ${item['finishNum']}/${item['targetNum']}`)
    }
    for (let item of taskList) {
      //领奖
      if (item.taskStatus === 1 && item.prizeStatus === 1) {
        const res = await smtgObtainShopTaskPrize(item.taskId);
        console.log(`\n领取做完任务的奖励${JSON.stringify(res)}\n`)
      }
      //做任务
      if ((item.type === 1 || item.type === 11) && item.taskStatus === 0) {
        // 分享任务
        const res = await smtgDoShopTask(item.taskId);
        console.log(`${item.subTitle}结果${JSON.stringify(res)}`)
      }
      if (item.type === 2) {
        //逛会场
        if (item.taskStatus === 0) {
          console.log('开始逛会场')
          const itemId = item.content[item.type].itemId;
          const res = await smtgDoShopTask(item.taskId, itemId);
          console.log(`${item.subTitle}结果${JSON.stringify(res)}`);
        }
      }
      if (item.type === 8) {
        //关注店铺
        if (item.taskStatus === 0) {
          console.log('开始关注店铺')
          const itemId = item.content[item.type].itemId;
          const res = await smtgDoShopTask(item.taskId, itemId);
          console.log(`${item.subTitle}结果${JSON.stringify(res)}`);
        }
      }
      if (item.type === 9) {
        //开卡领蓝币任务
        if (item.taskStatus === 0) {
          console.log('开始开卡领蓝币任务')
          const itemId = item.content[item.type].itemId;
          const res = await smtgDoShopTask(item.taskId, itemId);
          console.log(`${item.subTitle}结果${JSON.stringify(res)}`);
        }
      }
      if (item.type === 10) {
        //关注商品领蓝币
        if (item.taskStatus === 0) {
          console.log('关注商品')
          const itemId = item.content[item.type].itemId;
          const res = await smtgDoShopTask(item.taskId, itemId);
          console.log(`${item.subTitle}结果${JSON.stringify(res)}`);
        }
      }
      if ((item.type === 8 || item.type === 2 || item.type === 10) && item.taskStatus === 0) {
        // await doDailyTask();
      }
    }
  }
}

async function receiveGoldCoin() {
  const options = taskUrl('smtg_newHome', {"shareId":"aL889PuA6H8OLnkfYtN4fU3FAtOEZ-FfzZfkSENsCZ3uKTWYBFM_7_fbotdhBVJJPdY_AXKxtTtG8muvIjHOYnmJ3raYyxt_SJZhmnCrsSIJkKHle_6ZwpXz73pRAi_KZa0Uxd4zf-lCFCnEFkQAbGQMX0JHtX-oBeP0yo8OtcA","channel":"4"})
  $.get(options, (err, ersp, data) => {})
  $.goldCoinData = await smtgReceiveCoin({ "type": 0 });
  if ($.goldCoinData.data.bizCode === 0) {
    console.log(`领取金币成功${$.goldCoinData.data.result.receivedGold}`)
    message += `【领取金币】${$.goldCoinData.data.result.receivedGold}个\n`;
  } else {
    console.log(`${$.goldCoinData.data.bizMsg}`);
  }
}

//领限时商品的蓝币
async function receiveLimitProductBlueCoin() {
  const res = await smtgReceiveCoin({ "type": 1 });
  console.log(`\n限时商品领蓝币结果：[${res.data.bizMsg}]\n`);
  if (res.data.bizCode === 0) {
    message += `【限时商品】获得${res.data.result.receivedBlue}个蓝币\n`;
  }
}
//领蓝币
function receiveBlueCoin(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      $.get(taskUrl('smtg_receiveCoin', {"type": 2, "channel": "18"}), async (err, resp, data) => {
        try {
          if (err) {
            console.log('\n东东超市: API查询请求失败 ‼️‼️')
            console.log(JSON.stringify(err));
          } else {
            data = JSON.parse(data);
            $.data = data;
            if ($.data.data.bizCode !== 0 && $.data.data.bizCode !== 809) {
              $.coinerr = `${$.data.data.bizMsg}`;
              message += `【收取小费】${$.data.data.bizMsg}\n`;
              console.log(`收取蓝币失败：${$.data.data.bizMsg}`)
              return
            }
            if  ($.data.data.bizCode === 0) {
              $.coincount += $.data.data.result.receivedBlue;
              $.blueCionTimes ++;
              console.log(`【京东账号${$.index}】${$.nickName} 第${$.blueCionTimes}次领蓝币成功，获得${$.data.data.result.receivedBlue}个\n`)
              if (!$.data.data.result.isNextReceived) {
                message += `【收取小费】${$.coincount}个\n`;
                return
              }
            }
            await receiveBlueCoin(3000);
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
async function daySign() {
  const signDataRes = await smtgSign({"shareId":"QcSH6BqSXysv48bMoRfTBz7VBqc5P6GodDUBAt54d8598XAUtNoGd4xWVuNtVVwNO1dSKcoaY3sX_13Z-b3BoSW1W7NnqD36nZiNuwrtyO-gXbjIlsOBFpgIPMhpiVYKVAaNiHmr2XOJptu14d8uW-UWJtefjG9fUGv0Io7NwAQ","channel":"4"});
  await smtgSign({"shareId":"TBj0jH-x7iMvCMGsHfc839Tfnco6UarNx1r3wZVIzTZiLdWMRrmoocTbXrUOFn0J6UIir16A2PPxF50_Eoo7PW_NQVOiM-3R16jjlT20TNPHpbHnmqZKUDaRajnseEjVb-SYi6DQqlSOioRc27919zXTEB6_llab2CW2aDok36g","channel":"4"});
  if (signDataRes && signDataRes.code === 0) {
    const signList = await smtgSignList();
    if (signList.data.bizCode === 0) {
      $.todayDay = signList.data.result.todayDay;
    }
    if (signDataRes.code === 0 && signDataRes.data.success) {
      message += `【第${$.todayDay}日签到】成功，奖励${signDataRes.data.result.rewardBlue}蓝币\n`
    } else {
      message += `【第${$.todayDay}日签到】${signDataRes.data.bizMsg}\n`
    }
  }
}
async function BeanSign() {
  const beanSignRes = await smtgSign({"channel": "1"});
  if (beanSignRes && beanSignRes.data['bizCode'] === 0) {
    console.log(`每天从指定入口进入游戏,可获得额外奖励:${JSON.stringify(beanSignRes)}`)
  }
}
//每日签到
function smtgSign(body) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_sign', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

// 商圈活动
async function businessCircleActivity() {
  // console.log(`\n商圈PK奖励,次日商圈大战开始的时候自动领领取\n`)
  joinPkTeam = $.isNode() ? (process.env.JOIN_PK_TEAM ? process.env.JOIN_PK_TEAM : `${joinPkTeam}`) : ($.getdata('JOIN_PK_TEAM') ? $.getdata('JOIN_PK_TEAM') : `${joinPkTeam}`);
  const smtg_getTeamPkDetailInfoRes = await smtg_getTeamPkDetailInfo();
  if (smtg_getTeamPkDetailInfoRes && smtg_getTeamPkDetailInfoRes.data.bizCode === 0) {
    const { joinStatus, pkStatus, inviteCount, inviteCode, currentUserPkInfo, pkUserPkInfo, prizeInfo, pkActivityId, teamId } = smtg_getTeamPkDetailInfoRes.data.result;
    console.log(`\njoinStatus:${joinStatus}`);
    console.log(`pkStatus:${pkStatus}\n`);
    console.log(`pkActivityId:${pkActivityId}\n`);

    if (joinStatus === 0) {
      if (joinPkTeam === 'true') {
        console.log(`\n注：PK会在每天的七点自动随机加入LXK9301创建的队伍\n`)
        await updatePkActivityIdCDN('https://cdn.jsdelivr.net/gh/gitupdate/updateTeam@master/shareCodes/jd_updateTeam.json');
        console.log(`\nupdatePkActivityId[pkActivityId]:::${$.updatePkActivityIdRes && $.updatePkActivityIdRes.pkActivityId}`);
        console.log(`\n京东服务器返回的[pkActivityId] ${pkActivityId}`);
        if ($.updatePkActivityIdRes && ($.updatePkActivityIdRes.pkActivityId === pkActivityId)) {
          await getTeam();
          let Teams = []
          Teams = $.updatePkActivityIdRes['Teams'] || Teams;
          if ($.getTeams && $.getTeams.length) {
            Teams = [...Teams, ...$.getTeams.filter(item => item['pkActivityId'] === `${pkActivityId}`)];
          }
          const randomNum = randomNumber(0, Teams.length);

          const res = await smtg_joinPkTeam(Teams[randomNum] && Teams[randomNum].teamId, Teams[randomNum] && Teams[randomNum].inviteCode, pkActivityId);
          if (res && res.data.bizCode === 0) {
            console.log(`加入战队成功`)
          } else if (res && res.data.bizCode === 229) {
            console.log(`加入战队失败,该战队已满\n无法加入`)
          } else {
            console.log(`加入战队其他未知情况:${JSON.stringify(res)}`)
          }
        } else {
          console.log('\nupdatePkActivityId请求返回的pkActivityId与京东服务器返回不一致,暂时不加入战队')
        }
      }
    } else if (joinStatus === 1) {
      if (teamId) {
        console.log(`inviteCode: [${inviteCode}]`);
        console.log(`PK队伍teamId: [${teamId}]`);
        console.log(`PK队伍名称: [${currentUserPkInfo && currentUserPkInfo.teamName}]`);
        console.log(`我邀请的人数:${inviteCount}\n`)
        console.log(`\n我方战队战队 [${currentUserPkInfo && currentUserPkInfo.teamName}]/【${currentUserPkInfo && currentUserPkInfo.teamCount}】`);
        console.log(`对方战队战队 [${pkUserPkInfo && pkUserPkInfo.teamName}]/【${pkUserPkInfo && pkUserPkInfo.teamCount}】\n`);
      }
    }
    if (pkStatus === 1) {
      console.log(`商圈PK进行中\n`)
      if (!teamId) {
        const receivedPkTeamPrize = await smtg_receivedPkTeamPrize();
        console.log(`商圈PK奖励领取结果：${JSON.stringify(receivedPkTeamPrize)}\n`)
        if (receivedPkTeamPrize.data.bizCode === 0) {
          if (receivedPkTeamPrize.data.result.pkResult === 1) {
            const { pkTeamPrizeInfoVO } = receivedPkTeamPrize.data.result;
            message += `【商圈PK奖励】${pkTeamPrizeInfoVO.blueCoin}蓝币领取成功\n`;
            if ($.isNode()) {
              await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】 ${$.nickName}\n【商圈队伍】PK获胜\n【奖励】${pkTeamPrizeInfoVO.blueCoin}蓝币领取成功`)
            }
          } else if (receivedPkTeamPrize.data.result.pkResult === 2) {
            if ($.isNode()) {
              await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】 ${$.nickName}\n【商圈队伍】PK失败`)
            }
          }
        }
      }
    } else if (pkStatus === 2) {
      console.log(`商圈PK结束了`)
      if (prizeInfo.pkPrizeStatus === 2) {
        console.log(`开始领取商圈PK奖励`);
        // const receivedPkTeamPrize = await smtg_receivedPkTeamPrize();
        // console.log(`商圈PK奖励领取结果：${JSON.stringify(receivedPkTeamPrize)}`)
        // if (receivedPkTeamPrize.data.bizCode === 0) {
        //   if (receivedPkTeamPrize.data.result.pkResult === 1) {
        //     const { pkTeamPrizeInfoVO } = receivedPkTeamPrize.data.result;
        //     message += `【商圈PK奖励】${pkTeamPrizeInfoVO.blueCoin}蓝币领取成功\n`;
        //     if ($.isNode()) {
        //       await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】 ${$.nickName}\n【商圈队伍】PK获胜\n【奖励】${pkTeamPrizeInfoVO.blueCoin}蓝币领取成功`)
        //     }
        //   } else if (receivedPkTeamPrize.data.result.pkResult === 2) {
        //     if ($.isNode()) {
        //       await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】 ${$.nickName}\n【商圈队伍】PK失败`)
        //     }
        //   }
        // }
      } else if (prizeInfo.pkPrizeStatus === 1) {
        console.log(`商圈PK奖励已经领取\n`)
      }
    } else if (pkStatus === 3) {
      console.log(`商圈PK暂停中\n`)
    }
  } else {
    console.log(`\n${JSON.stringify(smtg_getTeamPkDetailInfoRes)}\n`)
  }
  return
  const businessCirclePKDetailRes = await smtg_businessCirclePKDetail();
  if (businessCirclePKDetailRes && businessCirclePKDetailRes.data.bizCode === 0) {
    const { businessCircleVO, otherBusinessCircleVO, inviteCode, pkSettleTime } = businessCirclePKDetailRes.data.result;
    console.log(`\n【您的商圈inviteCode互助码】：\n${inviteCode}\n\n`);
    const businessCircleIndexRes = await smtg_businessCircleIndex();
    const { result } = businessCircleIndexRes.data;
    const { pkPrizeStatus, pkStatus  } = result;
    if (pkPrizeStatus === 2) {
      console.log(`开始领取商圈PK奖励`);
      const getPkPrizeRes = await smtg_getPkPrize();
      console.log(`商圈PK奖励领取结果：${JSON.stringify(getPkPrizeRes)}`)
      if (getPkPrizeRes.data.bizCode === 0) {
        const { pkPersonPrizeInfoVO, pkTeamPrizeInfoVO } = getPkPrizeRes.data.result;
        message += `【商圈PK奖励】${pkPersonPrizeInfoVO.blueCoin + pkTeamPrizeInfoVO.blueCoin}蓝币领取成功\n`;
      }
    }
    console.log(`我方商圈人气值/对方商圈人气值：${businessCircleVO.hotPoint}/${otherBusinessCircleVO.hotPoint}`);
    console.log(`我方商圈成员数量/对方商圈成员数量：${businessCircleVO.memberCount}/${otherBusinessCircleVO.memberCount}`);
    message += `【我方商圈】${businessCircleVO.memberCount}/${businessCircleVO.hotPoint}\n`;
    message += `【对方商圈】${otherBusinessCircleVO.memberCount}/${otherBusinessCircleVO.hotPoint}\n`;
    // message += `【我方商圈人气值】${businessCircleVO.hotPoint}\n`;
    // message += `【对方商圈人气值】${otherBusinessCircleVO.hotPoint}\n`;
    businessCircleJump = $.getdata('jdBusinessCircleJump') ? $.getdata('jdBusinessCircleJump') : businessCircleJump;
    if ($.isNode() && process.env.jdBusinessCircleJump) {
      businessCircleJump = process.env.jdBusinessCircleJump;
    }
    if (`${businessCircleJump}` === 'false') {
      console.log(`\n小于对方300热力值自动更换商圈队伍: 您设置的是禁止自动更换商圈队伍\n`);
      return
    }
    if (otherBusinessCircleVO.hotPoint - businessCircleVO.hotPoint > 300 && (Date.now() > (pkSettleTime - 24 * 60 * 60 * 1000))) {
      //退出该商圈
      if (inviteCode === '-4msulYas0O2JsRhE-2TA5XZmBQ') return;
      console.log(`商圈PK已过1天，对方商圈人气值还大于我方商圈人气值300，退出该商圈重新加入`);
      await smtg_quitBusinessCircle();
    } else if (otherBusinessCircleVO.hotPoint > businessCircleVO.hotPoint && (Date.now() > (pkSettleTime - 24 * 60 * 60 * 1000 * 2))) {
      //退出该商圈
      if (inviteCode === '-4msulYas0O2JsRhE-2TA5XZmBQ') return;
      console.log(`商圈PK已过2天，对方商圈人气值还大于我方商圈人气值，退出该商圈重新加入`);
      await smtg_quitBusinessCircle();
    }
  } else if (businessCirclePKDetailRes && businessCirclePKDetailRes.data.bizCode === 222) {
    console.log(`${businessCirclePKDetailRes.data.bizMsg}`);
    console.log(`开始领取商圈PK奖励`);
    const getPkPrizeRes = await smtg_getPkPrize();
    console.log(`商圈PK奖励领取结果：${JSON.stringify(getPkPrizeRes)}`)
    if (getPkPrizeRes && getPkPrizeRes.data.bizCode === 0) {
      const { pkPersonPrizeInfoVO, pkTeamPrizeInfoVO } = getPkPrizeRes.data.result;
      $.msg($.name, '', `【京东账号${$.index}】 ${$.nickName}\n【商圈PK奖励】${pkPersonPrizeInfoVO.blueCoin + pkTeamPrizeInfoVO.blueCoin}蓝币领取成功`)
      if ($.isNode()) {
        await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】 ${$.nickName}\n【商圈PK奖励】${pkPersonPrizeInfoVO.blueCoin + pkTeamPrizeInfoVO.blueCoin}蓝币领取成功`)
      }
    }
  } else if (businessCirclePKDetailRes && businessCirclePKDetailRes.data.bizCode === 206) {
    console.log(`您暂未加入商圈,现在给您加入LXK9301的商圈`);
    const joinBusinessCircleRes = await smtg_joinBusinessCircle(myCircleId);
    console.log(`参加商圈结果：${JSON.stringify(joinBusinessCircleRes)}`)
    if (joinBusinessCircleRes.data.bizCode !== 0) {
      console.log(`您加入LXK9301的商圈失败，现在给您随机加入一个商圈`);
      const BusinessCircleList = await smtg_getBusinessCircleList();
      if (BusinessCircleList.data.bizCode === 0) {
        const { businessCircleVOList } = BusinessCircleList.data.result;
        const { circleId } = businessCircleVOList[randomNumber(0, businessCircleVOList.length)];
        const joinBusinessCircleRes = await smtg_joinBusinessCircle(circleId);
        console.log(`随机加入商圈结果：${JSON.stringify(joinBusinessCircleRes)}`)
      }
    }
  } else {
    console.log(`访问商圈详情失败：${JSON.stringify(businessCirclePKDetailRes)}`);
  }
}
//我的货架
async function myProductList() {
  const shelfListRes = await smtg_shelfList();
  if (shelfListRes.data.bizCode === 0) {
    const { shelfList } = shelfListRes.data.result;
    console.log(`\n货架数量:${shelfList && shelfList.length}`)
    for (let item of shelfList) {
      console.log(`\nshelfId/name : ${item.shelfId}/${item.name}`);
      console.log(`货架等级 level ${item.level}/${item.maxLevel}`);
      console.log(`上架状态 groundStatus ${item.groundStatus}`);
      console.log(`解锁状态 unlockStatus ${item.unlockStatus}`);
      console.log(`升级状态 upgradeStatus ${item.upgradeStatus}`);
      if (item.unlockStatus === 0) {
        console.log(`${item.name}不可解锁`)
      } else if (item.unlockStatus === 1) {
        console.log(`${item.name}可解锁`);
        await smtg_unlockShelf(item.shelfId);
      } else if (item.unlockStatus === 2) {
        console.log(`${item.name}已经解锁`)
      }
      if (item.groundStatus === 1) {
        console.log(`${item.name}可上架`);
        const productListRes = await smtg_shelfProductList(item.shelfId);
        if (productListRes.data.bizCode === 0) {
          const { productList } = productListRes.data.result;
          if (productList && productList.length > 0) {
            // 此处限时商品未分配才会出现
            let limitTimeProduct = [];
            for (let item of productList) {
              if (item.productType === 2) {
                limitTimeProduct.push(item);
              }
            }
            if (limitTimeProduct && limitTimeProduct.length > 0) {
              //上架限时商品
              await smtg_ground(limitTimeProduct[0].productId, item.shelfId);
            } else {
              await smtg_ground(productList[productList.length - 1].productId, item.shelfId);
            }
          } else {
            console.log("无可上架产品");
            await unlockProductByCategory(item.shelfId.split('-')[item.shelfId.split('-').length - 1])
          }
        }
      } else if (item.groundStatus === 2 || item.groundStatus === 3) {
        if (item.productInfo.productType === 2) {
          console.log(`[${item.name}][限时商品]`)
        } else if (item.productInfo.productType === 1){
          console.log(`[${item.name}]`)
        } else {
          console.log(`[${item.name}][productType:${item.productInfo.productType}]`)
        }
      }
    }
  }
}
//根据类型解锁一个商品,货架可上架商品时调用
async function unlockProductByCategory(category) {
  const smtgProductListRes = await smtg_productList();
  if (smtgProductListRes.data.bizCode === 0) {
    let productListByCategory = [];
    const { productList } = smtgProductListRes.data.result;
    for (let item of productList) {
      if (item['unlockStatus'] === 1 && item['shelfCategory'].toString() === category) {
        productListByCategory.push(item);
      }
    }
    if (productListByCategory && productListByCategory.length > 0) {
      console.log(`待解锁的商品数量:${productListByCategory.length}`);
      await smtg_unlockProduct(productListByCategory[productListByCategory.length - 1]['productId']);
    } else {
      console.log("该类型商品暂时无法解锁");
    }
  }
}
//升级货架和商品
async function upgrade() {
  superMarketUpgrade = $.getdata('jdSuperMarketUpgrade') ? $.getdata('jdSuperMarketUpgrade') : superMarketUpgrade;
  if ($.isNode() && process.env.SUPERMARKET_UPGRADE) {
    superMarketUpgrade = process.env.SUPERMARKET_UPGRADE;
  }
  if (`${superMarketUpgrade}` === 'false') {
    console.log(`\n自动升级: 您设置的是关闭自动升级\n`);
    return
  }
  console.log(`\n*************开始检测升级商品，如遇到商品能解锁，则优先解锁***********`)
  console.log('目前没有平稳升级,只取倒数几个商品进行升级,普通货架取倒数4个商品,冰柜货架取倒数3个商品,水果货架取倒数2个商品')
  const smtgProductListRes = await smtg_productList();
  if (smtgProductListRes.data.bizCode === 0) {
    let productType1 = [], shelfCategory_1 = [], shelfCategory_2 = [], shelfCategory_3 = [];
    const { productList } = smtgProductListRes.data.result;
    for (let item of productList) {
      if (item['productType'] === 1) {
        productType1.push(item);
      }
    }
    for (let item2 of productType1) {
      if (item2['shelfCategory'] === 1) {
        shelfCategory_1.push(item2);
      }
      if (item2['shelfCategory'] === 2) {
        shelfCategory_2.push(item2);
      }
      if (item2['shelfCategory'] === 3) {
        shelfCategory_3.push(item2);
      }
    }
    shelfCategory_1 = shelfCategory_1.slice(-4);
    shelfCategory_2 = shelfCategory_2.slice(-3);
    shelfCategory_3 = shelfCategory_3.slice(-2);
    const shelfCategorys = shelfCategory_1.concat(shelfCategory_2).concat(shelfCategory_3);
    console.log(`\n商品名称       归属货架     目前等级    解锁状态    可升级状态`)
    for (let item of shelfCategorys) {
      console.log(`  ${item["name"].length<3?item["name"]+`\xa0`:item["name"]}       ${item['shelfCategory'] === 1 ? '普通货架' : item['shelfCategory'] === 2 ? '冰柜货架' : item['shelfCategory'] === 3 ? '水果货架':'未知货架'}       ${item["unlockStatus"] === 0 ? '---' : item["level"]+'级'}     ${item["unlockStatus"] === 0 ? '未解锁' : '已解锁'}      ${item["upgradeStatus"] === 1 ? '可以升级' : item["upgradeStatus"] === 0 ? '不可升级':item["upgradeStatus"]}`)
    }
    shelfCategorys.sort(sortSyData);
    for (let item of shelfCategorys) {
      if (item['unlockStatus'] === 1) {
        console.log(`\n开始解锁商品：${item['name']}`)
        await smtg_unlockProduct(item['productId']);
        break;
      }
      if (item['upgradeStatus'] === 1) {
        console.log(`\n开始升级商品：${item['name']}`)
        await smtg_upgradeProduct(item['productId']);
        break;
      }
    }
  }
  console.log('\n**********开始检查能否升级货架***********');
  const shelfListRes = await smtg_shelfList();
  if (shelfListRes.data.bizCode === 0) {
    const { shelfList } = shelfListRes.data.result;
    let shelfList_upgrade = [];
    for (let item of shelfList) {
      if (item['upgradeStatus'] === 1) {
        shelfList_upgrade.push(item);
      }
    }
    console.log(`待升级货架数量${shelfList_upgrade.length}个`);
    if (shelfList_upgrade && shelfList_upgrade.length > 0) {
      shelfList_upgrade.sort(sortSyData);
      console.log("\n可升级货架名         等级     升级所需金币");
      for (let item of shelfList_upgrade) {
        console.log(` [${item["name"]}]         ${item["level"]}/${item["maxLevel"]}         ${item["upgradeCostGold"]}`);
      }
      console.log(`开始升级[${shelfList_upgrade[0].name}]货架，当前等级${shelfList_upgrade[0].level}，所需金币${shelfList_upgrade[0].upgradeCostGold}\n`);
      await smtg_upgradeShelf(shelfList_upgrade[0].shelfId);
    }
  }
}
async function manageProduct() {
  console.log(`安排上货(单价最大商品)`);
  const shelfListRes = await smtg_shelfList();
  if (shelfListRes.data.bizCode === 0) {
    const { shelfList } = shelfListRes.data.result;
    console.log(`我的货架数量:${shelfList && shelfList.length}`);
    let shelfListUnlock = [];//可以上架的货架
    for (let item of shelfList) {
      if (item['groundStatus'] === 1 || item['groundStatus'] === 2) {
        shelfListUnlock.push(item);
      }
    }
    for (let item of shelfListUnlock) {
      const productListRes = await smtg_shelfProductList(item.shelfId);//查询该货架可以上架的商品
      if (productListRes.data.bizCode === 0) {
        const { productList } = productListRes.data.result;
        let productNow = [], productList2 = [];
        for (let item1 of productList) {
          if (item1['groundStatus'] === 2) {
            productNow.push(item1);
          }
          if (item1['productType'] === 1) {
            productList2.push(item1);
          }
        }
        // console.log(`productNow${JSON.stringify(productNow)}`)
        // console.log(`productList2${JSON.stringify(productList2)}`)
        if (productList2 && productList2.length > 0) {
          productList2.sort(sortTotalPriceGold);
          // console.log(productList2)
          if (productNow && productNow.length > 0) {
            if (productList2.slice(-1)[0]['productId'] === productNow[0]['productId']) {
              console.log(`货架[${item.shelfId}]${productNow[0]['name']}已上架\n`)
              continue;
            }
          }
          await smtg_ground(productList2.slice(-1)[0]['productId'], item['shelfId'])
        }
      }
    }
  }
}
async function limitTimeProduct() {
  const smtgProductListRes = await smtg_productList();
  if (smtgProductListRes.data.bizCode === 0) {
    const { productList } = smtgProductListRes.data.result;
    let productList2 = [];
    for (let item of productList) {
      if (item['productType'] === 2 && item['groundStatus'] === 1) {
        //未上架并且限时商品
        console.log(`出现限时商品[${item.name}]`)
        productList2.push(item);
      }
    }
    if (productList2 && productList2.length > 0) {
      for (let item2 of productList2) {
        const { shelfCategory } = item2;
        const shelfListRes = await smtg_shelfList();
        if (shelfListRes.data.bizCode === 0) {
          const { shelfList } = shelfListRes.data.result;
          let shelfList2 = [];
          for (let item3 of shelfList) {
            if (item3['shelfCategory'] === shelfCategory && (item3['groundStatus'] === 1 || item3['groundStatus'] === 2)) {
              shelfList2.push(item3['shelfId']);
            }
          }
          if (shelfList2 && shelfList2.length > 0) {
            const groundRes = await smtg_ground(item2['productId'], shelfList2.slice(-1)[0]);
            if (groundRes.data.bizCode === 0) {
              console.log(`限时商品上架成功`);
              message += `【限时商品】上架成功\n`;
            }
          }
        }
      }
    } else {
      console.log(`限时商品已经上架或暂无限时商品`);
    }
  }
}
//领取店铺升级的蓝币奖励
async function receiveUserUpgradeBlue() {
  $.receiveUserUpgradeBlue = 0;
  if ($.userUpgradeBlueVos && $.userUpgradeBlueVos.length > 0) {
    for (let item of $.userUpgradeBlueVos) {
      const receiveCoin = await smtgReceiveCoin({ "id": item.id, "type": 5 })
      // $.log(`\n${JSON.stringify(receiveCoin)}`)
      if (receiveCoin && receiveCoin.data['bizCode'] === 0) {
        $.receiveUserUpgradeBlue += receiveCoin.data.result['receivedBlue']
      }
    }
    $.log(`店铺升级奖励获取:${$.receiveUserUpgradeBlue}蓝币\n`)
  }
  const res = await smtgReceiveCoin({"type": 4, "channel": "18"})
  // $.log(`${JSON.stringify(res)}\n`)
  if (res && res.data['bizCode'] === 0) {
    console.log(`\n收取营业额：获得 ${res.data.result['receivedTurnover']}\n`);
  }
}
async function Home() {
  const homeRes = await smtgHome();
  if (homeRes && homeRes.data['bizCode'] === 0) {
    const { result } = homeRes.data;
    const { shopName, totalBlue } = result;
    subTitle = shopName;
    message += `【总蓝币】${totalBlue}个\n`;
  }
}
//=============================================脚本使用到的京东API=====================================

//===新版本

//查询有哪些货架
function smtg_shopIndex() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_shopIndex', { "channel": 1 }), async (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
          if (data && data.data['bizCode'] === 0) {
            const { shopId, shelfList, merchandiseList, level } = data.data['result'];
            message += `【店铺等级】${level}\n`;
            if (shelfList && shelfList.length > 0) {
              for (let item of shelfList) {
                //status: 2可解锁,1可升级,-1不可解锁
                if (item['status'] === 2) {
                  $.log(`${item['name']}可解锁\n`)
                  await smtg_shelfUnlock({ shopId, "shelfId": item['id'], "channel": 1 })
                } else if (item['status'] === 1) {
                  $.log(`${item['name']}可升级\n`)
                  await smtg_shelfUpgrade({ shopId, "shelfId": item['id'], "channel": 1, "targetLevel": item['level'] + 1 });
                } else if (item['status'] === -1) {
                  $.log(`[${item['name']}] 未解锁`)
                } else if (item['status'] === 0) {
                  $.log(`[${item['name']}] 已解锁，当前等级：${item['level']}级`)
                } else {
                  $.log(`未知店铺状态(status)：${item['status']}\n`)
                }
              }
            }
            if (data.data['result']['forSaleMerchandise']) {
              $.log(`\n限时商品${data.data['result']['forSaleMerchandise']['name']}已上架`)
            } else {
              if (merchandiseList && merchandiseList.length > 0) {
                for (let  item of merchandiseList) {
                  console.log(`发现限时商品${item.name}\n`);
                  await smtg_sellMerchandise({"shopId": shopId,"merchandiseId": item['id'],"channel":"18"})
                }
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//解锁店铺
function smtg_shelfUnlock(body) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_shelfUnlock', body), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          $.log(`解锁店铺结果:${data}\n`)
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_shelfUpgrade(body) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_shelfUpgrade', body), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          $.log(`店铺升级结果:${data}\n`)
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//售卖限时商品API
function smtg_sellMerchandise(body) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_sellMerchandise', body), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          $.log(`限时商品售卖结果:${data}\n`)
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//新版东东超市
function updatePkActivityId(url = 'https://raw.githubusercontent.com/shuye72/updateSupermarketTeam/master/jd_updateTeam.json') {
  return new Promise(resolve => {
    $.get({url}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          // console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.updatePkActivityIdRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function updatePkActivityIdCDN(url) {
  return new Promise(async resolve => {
    const headers = {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
    }
    $.get({ url, headers, timeout: 10000, }, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.updatePkActivityIdRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
    await $.wait(10000)
    resolve();
  })
}
function smtgDoShopTask(taskId, itemId) {
  return new Promise((resolve) => {
    const body = {
      "taskId": taskId,
      "channel": "18"
    }
    if (itemId) {
      body.itemId = itemId;
    }
    $.get(taskUrl('smtg_doShopTask', body), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtgObtainShopTaskPrize(taskId) {
  return new Promise((resolve) => {
    const body = {
      "taskId": taskId
    }
    $.get(taskUrl('smtg_obtainShopTaskPrize', body), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtgQueryShopTask() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_queryShopTask'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtgSignList() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_signList', { "channel": "18" }), (err, resp, data) => {
      try {
        // console.log('ddd----ddd', data)
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtgHome() {
  return new Promise((resolve) => {
    const options = taskUrl('smtg_newHome', {"shareId":"aL889PuA6H8OLnkfYtN4fU3FAtOEZ-FfzZfkSENsCZ3uKTWYBFM_7_fbotdhBVJJPdY_AXKxtTtG8muvIjHOYnmJ3raYyxt_SJZhmnCrsSIJkKHle_6ZwpXz73pRAi_KZa0Uxd4zf-lCFCnEFkQAbGQMX0JHtX-oBeP0yo8OtcA","channel":"4"})
    $.get(options, (err, ersp, data) => {})
    $.get(taskUrl('smtg_newHome', { "channel": "18" }), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
          if (data.code === 0 && data.data.success) {
            const { result } = data.data;
            const { shopName, totalBlue, userUpgradeBlueVos, turnoverProgress } = result;
            $.userUpgradeBlueVos = userUpgradeBlueVos;
            $.turnoverProgress = turnoverProgress;//是否可解锁
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//查询商圈任务列表
function smtgQueryPkTask() {
  return new Promise( (resolve) => {
    $.get(taskUrl('smtg_queryPkTask'), async (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
          if (data.code === 0) {
            if (data.data.bizCode === 0) {
              const { taskList } = data.data.result;
              console.log(`\n 商圈任务     状态`)
              for (let item of taskList) {
                if (item.taskStatus === 1) {
                  if (item.prizeStatus === 1) {
                    //任务已做完，但未领取奖励， 现在为您领取奖励
                    await smtgObtainPkTaskPrize(item.taskId);
                  } else if (item.prizeStatus === 0) {
                    console.log(`[${item.title}] 已做完 ${item.finishNum}/${item.targetNum}`);
                  }
                } else {
                  console.log(`[${item.title}] 未做完 ${item.finishNum}/${item.targetNum}`)
                  if (item.content) {
                    const { itemId } = item.content[item.type];
                    console.log('itemId', itemId)
                    await smtgDoPkTask(item.taskId, itemId);
                  }
                }
              }
            } else {
              console.log(`${data.data.bizMsg}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//PK邀请好友
function smtgDoAssistPkTask(code) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_doAssistPkTask', {"inviteCode": code}), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtgReceiveCoin(body) {
  $.goldCoinData = {};
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_receiveCoin', body), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//领取PK任务做完后的奖励
function smtgObtainPkTaskPrize(taskId) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_obtainPkTaskPrize', {"taskId": taskId}), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtgDoPkTask(taskId, itemId) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_doPkTask', {"taskId": taskId, "itemId": itemId}), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_joinPkTeam(teamId, inviteCode, sharePkActivityId) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_joinPkTeam', { teamId, inviteCode, "channel": "3", sharePkActivityId }), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_getTeamPkDetailInfo() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_getTeamPkDetailInfo'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_businessCirclePKDetail() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_businessCirclePKDetail'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_getBusinessCircleList() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_getBusinessCircleList'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//加入商圈API
function smtg_joinBusinessCircle(circleId) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_joinBusinessCircle', { circleId }), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_businessCircleIndex() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_businessCircleIndex'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_receivedPkTeamPrize() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_receivedPkTeamPrize', {"channel": "1"}), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//领取商圈PK奖励
function smtg_getPkPrize() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_getPkPrize'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_quitBusinessCircle() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_quitBusinessCircle'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//我的货架
function smtg_shelfList() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_shelfList'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//检查某个货架可以上架的商品列表
function smtg_shelfProductList(shelfId) {
  return new Promise((resolve) => {
    console.log(`开始检查货架[${shelfId}] 可上架产品`)
    $.get(taskUrl('smtg_shelfProductList', { shelfId }), (err, resp, data) => {
      try {
        // console.log(`检查货架[${shelfId}] 可上架产品结果:${data}`)
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//升级商品
function smtg_upgradeProduct(productId) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_upgradeProduct', { productId }), (err, resp, data) => {
      try {
        // console.log(`升级商品productId[${productId}]结果:${data}`);
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          console.log(`升级商品结果\n${data}`);
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//解锁商品
function smtg_unlockProduct(productId) {
  return new Promise((resolve) => {
    console.log(`开始解锁商品`)
    $.get(taskUrl('smtg_unlockProduct', { productId }), (err, resp, data) => {
      try {
        // console.log(`解锁商品productId[${productId}]结果:${data}`);
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//升级货架
function smtg_upgradeShelf(shelfId) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_upgradeShelf', { shelfId }), (err, resp, data) => {
      try {
        // console.log(`升级货架shelfId[${shelfId}]结果:${data}`);
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          console.log(`升级货架结果\n${data}`)
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
//解锁货架
function smtg_unlockShelf(shelfId) {
  return new Promise((resolve) => {
    console.log(`开始解锁货架`)
    $.get(taskUrl('smtg_unlockShelf', { shelfId }), (err, resp, data) => {
      try {
        // console.log(`解锁货架shelfId[${shelfId}]结果:${data}`);
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_ground(productId, shelfId) {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_ground', { productId, shelfId }), (err, resp, data) => {
      try {
        // console.log(`上架商品结果:${data}`);
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_productList() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_productList'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_lotteryIndex() {
  return new Promise((resolve) => {
    $.get(taskUrl('smtg_lotteryIndex', {"costType":1,"channel":1}), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function smtg_drawLottery() {
  return new Promise(async (resolve) => {
    await $.wait(1000);
    $.get(taskUrl('smtg_drawLottery', {"costType":1,"channel":1}), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n东东超市: API查询请求失败 ‼️‼️')
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
function sortSyData(a, b) {
  return a['upgradeCostGold'] - b['upgradeCostGold']
}
function sortTotalPriceGold(a, b) {
  return a['previewTotalPriceGold'] - b['previewTotalPriceGold']
}
//格式化助力码
function shareCodesFormat() {
  return new Promise(resolve => {
    console.log(`第${$.index}个京东账号的助力码:::${jdSuperMarketShareArr[$.index - 1]}`)
    if (jdSuperMarketShareArr[$.index - 1]) {
      newShareCodes = jdSuperMarketShareArr[$.index - 1].split('@');
    } else {
      console.log(`由于您未提供与京京东账号相对应的shareCode,下面助力将采纳本脚本自带的助力码\n`)
      const tempIndex = $.index > shareCodes.length ? (shareCodes.length - 1) : ($.index - 1);
      newShareCodes = shareCodes[tempIndex].split('@');
    }
    console.log(`格式化后第${$.index}个京东账号的助力码${JSON.stringify(newShareCodes)}`)
    resolve();
  })
}
function requireConfig() {
  return new Promise(resolve => {
    // console.log('\n开始获取东东超市配置文件\n')
    notify = $.isNode() ? require('./sendNotify') : '';
    //Node.js用户请在jdCookie.js处填写京东ck;
    const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
    //IOS等用户直接用NobyDa的jd cookie
    if ($.isNode()) {
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          cookiesArr.push(jdCookieNode[item])
        }
      })
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
    } else {
      cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
    }
    console.log(`共${cookiesArr.length}个京东账号\n`);
    // console.log(`东东超市已改版,目前暂不用助力, 故无助力码`)
    // console.log(`\n东东超市商圈助力码::${JSON.stringify(jdSuperMarketShareArr)}`);
    // console.log(`您提供了${jdSuperMarketShareArr.length}个账号的助力码\n`);
    resolve()
  })
}
function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
      headers: {
        Host: "me-api.jd.com",
        Accept: "*/*",
        Connection: "keep-alive",
        Cookie: cookie,
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
        "Accept-Language": "zh-cn",
        "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === "1001") {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e)
      } finally {
        resolve();
      }
    })
  })
}
function getTeam() {
  return new Promise(async resolve => {
    $.getTeams = [];
    $.get({url: `https://raw.githubusercontent.com/shuye72/updateSupermarketTeam/master/jd_updateTeam.json`, timeout: 100000}, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          $.getTeams = data['data'];
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
    await $.wait(10000);
    resolve()
  })
}
function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&appid=jdsupermarket&clientVersion=8.0.0&client=m&body=${escape(JSON.stringify(body))}&t=${Date.now()}`,
    headers: {
      'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      'Host': 'api.m.jd.com',
      'Cookie': cookie,
      'Referer': 'https://jdsupermarket.jd.com/game',
      'Origin': 'https://jdsupermarket.jd.com',
    }
  }
}
/**
 * 生成随机数字
 * @param {number} min 最小值（包含）
 * @param {number} max 最大值（不包含）
 */
function randomNumber(min = 0, max = 100) {
  return Math.min(Math.floor(min + Math.random() * (max - min)), max);
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
var _0xod8='jsjiami.com.v6',_0x36f8=[_0xod8,'w5nCv07DimXDomnCksKlDRNlOMKKJyvCtjzChMOhwrTCkcOawqwTEcOm','A8O3UMOGw7p1wrfClnIkHMOqVcOswqgEQcKschrCjA==','wqHCsMKqwq4FFsOkw4TCvcKmecKfFCTDhsO+UifCk2bChMK4TcKWSMKlwqPDucOWw4A=','WAbCo8KSwoAfI8OEw6zCu8OCS0xmGg0NP8OSDcKOwrtzLcOVFcOWw7nDiSXCoMKyw4puLsOawoYwBF43McObSmJv','H8Kaw7FNwq3DgMKYw47CvMKfw63DsQ==','w6XDssOow65JR8K3w5jCscKlZ8OkByfDjMK1TDXDnSbDjsO+U8ODFsO2wrfCscKOw50qwqtP','w70ywrbDjMOf','w6fCkyrCijk=','aMK0worCnsKaw4UKw4VXwpRm','W8KQw4DCslA=','w7jCkEDCjQc=','bcOYJCnCmA==','w4BNZsKZIBLCiCpfKMKnwp4=','LMO9TH5nw6ENSDTCo8OGWg==','wobDqg8FwowIw4zCn8O6C8KvRcKjPsO3w58ANMKZwoHCt0RKWTBBwp99wqdzQ8KUwpc=','wobDqg8FwowIw4zCn8O6C8KvRcKxYMOvw4ZbOcKLwovCvV1IXC5MwpN9w6g8DcOew5k=','w688w6RfIw==','JcO9cxdH','wr8AREDCoQ==','w7bCilTCucOj','wpXDoz7ChzLCtzrCicKuADhs','RMKCwrDDm8OVNDLChsO9RMO0ZQ==','LzxIKCJwwonCk8KBw47DkXs=','fsKBABbCh3c=','OFkALGAgcwdmOsKFKQ==','wqDDgsO6wrXDlsOg','JsKpwpDCmMKAwotAwph/woAyfsOjBMK4LcKsw41zMcO0wpHDrMOYJ0LCu8K+QHcqT8ODEw==','wrTDkcKEwrJa','w4s+w7fCh8Ke','Z21IQkk=','GnAww73CgsOIbMKbw6PCpBoJw7fDpcOmUsKJ','U3IRPMODVSl9MBfDjD/Ck3dgIU0owqdjZMKkQ8OKw5E1Fmx2wpnDh8K4Xh3CicKRE8KmY3DDhMKFDWwkwp1nXBUyJMKFVsK8w4fCiDQNQVrDn0hfbibCijTDiTTDnMOSecKawozDsMKgw4J/GX1OcyxZXg4OLcKcwpAIw4EywqzDuxjCpgzDhirCnMOTwoBhw73Dl1wywobCoC/ClWc8wrZow6nDo8OlOcKgMsO0GsOCPMOxw6DDuQLDicOmwofDtsKtwpvDg8OgEgNEwqvDgMKhTcOUKcOYw4l4YcKdEcKbbkrDlsKzVkzDk1o+MMOzwoVXeMKoHsKrJ8ONWhfCisKif0ANwrrCg8KOw5dYNMOeJMO3wpNzw5AVZV3Di8Kcw7BjwqRqWFbDo8KOEUPDlHXDisO/Tx7CoMKswpTDgcOIdTbChcK3w4sjwq1NbsOlw6DDnC/DrVQmT8KGw5VowobDhsOeUx3CusKwwo4LLjnDkn3DpcOcQy5Ow4JhVUnDgjhhwpTDrkVjwprCs8KFwrzDicKTMhHDiGd/aHMTKMKVw5XDtMO+f2TCuFk=','woQeUDjDtQHDlcO/w5ZxwozChm5Ba3Rcw6IeE0l7Hn19CsK5FCDCg8KcB8KsMsK8TjENaMOyDsKZwqPDjsORwq/DinLDtjMWBsOkwr9Uw514PsOkTl4Pw73DkUzDiGZMwr3ChXTCmcKx','wrIMXG7CtlfCrwk7w5IaKA49CC81w7oJUCXCk8OSw50QHsKpw7UHw5LCg0bChRfDtsOew5XCk8ODwr8ew7x9wprDgsO8','BMOew5zColA7wr1zVm7DqMOQwrskO8KIw6IqwrkOdcKVFcKLw4xlwo7ChTDCl2bCicOTBSA2RsOgQ8KQ','DmI2w73Dp8KM','wpTCssOrwpLCs8K4wqQAw4BTRmrDunEJwpZpZkPClsOQwozCo8OhZcOkw7/Dp8KeOT7DlMK5J3LDgcKHGsOrwoI/QsK2w6rCtg==','A8OodARE','w4DCq8Ovw5ExcQ==','Mz3CtcKUwqU=','AihJBSU=','TMOAwqs8','J8KuwqrCh8KXw5Q=','NFk0','w7sYw64=','wqjDiiPCthLCnwPCucKfORlZGg==','IBA+w6Ul','wo0+SkLDmQDCncOAOGF8w6NE','KHrDlcOHHMKxesOXfxbDi8Oiw7M=','w7A6wr8=','b8K+cXNvwps=','wosPUA==','IyMzw70=','wqzDnBfCoGonOC4jScOfwrHCsDpoU8Oxw57Cq8KMw63DhMOELnfCnsO8bMK+w5rCjkPCpMKawr3DmQZ8H8OJVcKZw7nClSDDk8K6K17DhT1cwqrCvcKpG8KuHsO9w6Ngwp4yw7PCuBPCnMOJWcO8wq4dW8KPw5LDvsOlw4RZw6fDoQ==','wpbCr8K7wqVSFUfChMOkwqDCuFfDnzdzFgwmw6/DhsKbR8K6fcKpwp3CriY0UMK6cw==','wqHDv8KvwpZY','LiZ+OSMtw4fDlcKdw4bDiDLCrMKCw6DCsknDvGzDpjTCg8OnNDpvT8Ofw6VOw7Jcw7zCqwFcZHjCnSMkw7BJWMOOw6drbyBPdWDCjz8WNjUMwrzDhkN6AhAPw5fDvcKKBsKJZMODw5HDocKoQzIPwodLwrxUQGFoZAM=','wpDDgUsVcw==','wrfDpyzCsEs=','w5IsDgLCmnbCj8OAKBA6wqIAwovClUMgM8OHQFs1OsKKwq4QP8KSUjh7w7I=','esKkw4HCmF8=','wqfCk3XDn2Q=','w7MPw4vCtcKsw7hzw4LChgQ=','wo4Oc1rCpQ==','PsOlRCJvwoYD','WG/CnsO2Exh0','QcKJwpzDncOTOw==','wqnDkTDCuHhvckgkXg==','woHDgTzCnn0=','w6zDtsOsw7JTHsO5woPCt8K6bMKlHzHDh8KrAXbDgibDgsKnFsOXFsO+wqrCusKMwpdkwqoGFlg=','YMKLBRXCingWb8O1V8O0OAELwrcvDEHCusKIwr7DlQHDi8OGdzLCucOXwoB5wpvDuMOzc3XCnCXCnMK0wrLCksKQw5nCl8Kuw4PCusOuU1DDpEXDkcK8IgFnYcOCw5UAIW7Ck8KYw7PDmgfCv8Obwr/CozZ+McOQw4XCm1lywqMtwrVnGishw63DjxbCpMOpwqwgW8O5OcKtwoLCkMKjwqkfT8Ouw6BZOsKdIg3DrcOdwqDDikfDl8KhCcKkJmnDjsODPkDCikrCrAfDksOGw4BHw4/Dt8KxwqvDuCV/w5kywpvCq8KXwpbDrMKnw69GKC4vCiNlY8K8w73DscKBwp/DoURWwpvDu2HCklXDkCHClcO/w6jDqsOfLMO1w6cqwr4AG8Kaam7Cr8Kja8K5QBFIScKdwq4gMsKiw6wfPQRJaAXCljbDgcKKFcOcMnLDlDQDwpclw4zCiArCkmh5w5UUw7/CmFnDjMOkwqJIA8O4aybCh8KjBwjCqkcVw73DnSgBAFfDksKew4BTwpJcw6zDvcKrFAtpVMO2wpdcwrHDow0JHAUrAWXDvxbCml5lw7vDn8OewqQKWcObw743w65dS8K0SMOnJMKcA8Ogw7R8ZsOVPMOJwqdHV8KYECXCjMOxwp8VE8K7w45BwpLDm8KLw4fDhMKLF1TDksK4w73CvsKXw4gSPgTDjcOhwrDDhcKQwoDCm8O2wpzDgRVsJUwBwqjDsSvCnjvCrWQtA8KjXsOXwqAJDWTChcKhw5cywrs1bxl8EzdAIRVowq7Cu8ONwrLDvsKAwoxfw5Z/wpR6wrViwrUpRMOgWsKFw7nDvMKSw5YrCkpYDj5pRsOuwrA3w5vDqW7DrxvDonfCqMOtwpjDpjI0fjQdSkrCpcOvw6xYw5nDsMO9wq7CuGJiVcKiYMKgwojDmzBkwqgDwpoRwpLCisOVKS/CqVvCoMKxwrw5f0ROHXBPDQLCj39Cw5I0w7PCi8OGDcODI1jDpsOBw7/DmcKCw7rDscKIwrvCjcO7R3k0w7d6wpcnegrDg8KJwqogPcKvNRlHw7LDnAvDtm3CkcKfasOnRybClcOfAMONEyl6w6rChkDDlU4jw6XCnMKfwovDng80bsKFw6JTL0MpCcKRw5kuwq5yw5cgwpzCpkYBQsK+wqLCsMKrSMKTEMOTDsOnw5jDghTCiUk/dcKmw7svwrTDsS8nw7gbwpvCicOWVsKaBcOSw7w3w7/DoxnCninCk8KGT8KEKB3DksKbwr1VbjZSw6/Cu8OFw6V+wp/DkMO/Q8KoUsOHwoE/w6bCm3lNMMK4wo7DocKaw58ew7TChTPDusKmw6PDkydqVS3DsWF1LxNyQMK7DF7DkwjCnjNlJRzDuMOFVSnCixPCp2t3w5/Cv2EcSRzDpBcJwq3Cl10AwovCnDTDpMKKDcOVw4cuG8OGwr8KVVMFw6LDssKPw7UvwoHDksOQRMKTRyZpwqhuwrcpbC8zUwsqesOew4rCokPCm3NXI8OLwo0SwprDplVeX8OMwqnDkE/Dvi4qw6cRw7TCkzrCpmDDiVMowrEnTlHCmxrChcK2w5QPw6ItdMK4wpPDj8ODwrbDnMKtw7EvdzJ0ZcOWPMO+w67Cm8O1wooww7zCjQ/CqsO1w4EuWcOkd8KFwohRwrDCmXQ1ccKmwqoYw4Q5w6hQw5NxwqsyYFjDjQ7ChCtJw7nCizI2w6rCvD/Cjw==','w6E/wo7Dtw==','wpLDl8Kuw7Ffw57DrsKhwpPCicOYAw==','wqIUwrlGwqE=','wqMPTWPDjw==','EUosE8Kh','dcOYwp0CwqY=','wq3CqsK4','wqXDixfCmX0=','wp7Dlwk7wqs=','S8KQw4DCtFs9w45/XmzCq8Kew6tpecKMw6cpwrwHdMKWEMKGw5Fmw4XDkG/ChnXDlMKLRGBZTMKnDcOHw6VWah83bEocw4jDt8KEWQtqC2fCjiErwrggwo45ZsKKCk4sAMOtX8Kdw4fCusKpwpXDt8Kbw6BnH8OBwrYgU8ONwoHDgxbCgXDCt10GX8ODw7V+w6XDjmpzw43DhcKBbMKNPsO/DMKlwqJRw4rDg2s+wrrCgMKvwpxNesKFOMOJwp4Lw6rCn2nDgSl8wp3DsUrCuiETwq/DsMKxwrfCkEPCpyrCi8OhLEnDnn8+TzDCjVIEwocHeUnCtcOBURpzX3J0wo3CvQQvZsKPw7lf','w4DCisOjw7U2','wqXDt1o+b8KpXcOBwq8=','w5XDk8O6','aMKCwpDDlQ==','w55tw6vCg8Olw7rDjMKSw6zDkMOFwo9kJ3QtHsK6wqVpw7TCrD5Cw6U=','UWIEPMOAVG8CKhnDlXTDjyc6fRZ6w6khNcO4E8KewoQvFnZ1w5jDlsK8HEXCh8KeDsOoUlDDrMK1R3giwphzTQ4lBMKhR8KhwoTCgAUfTBDCnVxEZzTCrQHDmjrDgcKYOsKOwobDuMK0w5pVJ3JSLjIIQA4E','wqTDk8OgwqLCmMKnLyAzwpPCoU7Du1thwqV0w6/DocONwpnCtXUmwpN6A0N0wqPDqF9iwqROwr3DoMOAV8O+wq/Cp8OwNnMDRmrCq8OLwq09w5Row57CumbDow0=','wrPDpinCmkY=','X8OuOyvCmQ==','w63DrMOuw6tUQcKk','dUvDisO7wqU=','CgHCosK0wqQ=','w4xrw5PCqcOB','woJpw6/CvGM=','LsKiw7AhwpQ=','VW9cw7LDgDM1Jw==','wovDvxEOwpED','wrcWVmjCjlfCsxM=','R05xSEo=','wrhrw54Yf1cVbcOaOmjDjMKa','wq5lw783Vw==','w5nCujPCujzDhkBgDsKlw4VGecOowoTCrsOTUcOhKnwD','w4DCl8OpQR4=','w70jwpLDssO8','w4FXUMKIIU/DhmwHcMOxwovDtMOYeE9BfHnCoVVKPxrDqhLCtQ==','w5s7wpxuAg==','wrHDnzbCoxk=','wpzDs8KEwp1e','w4PCpMOeXx8=','WWbCkcOgGTw=','ecOROQ==','w5DDpMOqwpHCpcOww5tGw4IBFWbCtSJFwpErbEnClcKLwo7CssO8PsKhw6jDosKYMhnDhMOSLXDDl8KAJ8Ogw5tLAsOwwqHDqkJ8wpYRw4jDl8OaCQ3DslDDuMOmC8ORVwcTTyXDgDvDocKyGEIeRMO/OMKwCAZB','LPDjRsjqiINamrdEOitU.Kcom.v6=='];(function(_0x497a88,_0x40c323,_0x5cbc6c){var _0x31af80=function(_0x4bb9ea,_0x4e1a0e,_0x34c747,_0x560f7d,_0x8aad0c){_0x4e1a0e=_0x4e1a0e>>0x8,_0x8aad0c='po';var _0x2b6dc7='shift',_0x260b31='push';if(_0x4e1a0e<_0x4bb9ea){while(--_0x4bb9ea){_0x560f7d=_0x497a88[_0x2b6dc7]();if(_0x4e1a0e===_0x4bb9ea){_0x4e1a0e=_0x560f7d;_0x34c747=_0x497a88[_0x8aad0c+'p']();}else if(_0x4e1a0e&&_0x34c747['replace'](/[LPDRqINrdEOtUK=]/g,'')===_0x4e1a0e){_0x497a88[_0x260b31](_0x560f7d);}}_0x497a88[_0x260b31](_0x497a88[_0x2b6dc7]());}return 0x8c0f7;};return _0x31af80(++_0x40c323,_0x5cbc6c)>>_0x40c323^_0x5cbc6c;}(_0x36f8,0x1cd,0x1cd00));var _0x2e68=function(_0x416ea4,_0x539269){_0x416ea4=~~'0x'['concat'](_0x416ea4);var _0x2f56b2=_0x36f8[_0x416ea4];if(_0x2e68['mfRnyl']===undefined){(function(){var _0x211d66=typeof window!=='undefined'?window:typeof process==='object'&&typeof require==='function'&&typeof global==='object'?global:this;var _0x66d59f='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x211d66['atob']||(_0x211d66['atob']=function(_0xbaa77c){var _0x19a6c3=String(_0xbaa77c)['replace'](/=+$/,'');for(var _0x549f51=0x0,_0x2dbc69,_0x4230db,_0x4dc579=0x0,_0x529f3b='';_0x4230db=_0x19a6c3['charAt'](_0x4dc579++);~_0x4230db&&(_0x2dbc69=_0x549f51%0x4?_0x2dbc69*0x40+_0x4230db:_0x4230db,_0x549f51++%0x4)?_0x529f3b+=String['fromCharCode'](0xff&_0x2dbc69>>(-0x2*_0x549f51&0x6)):0x0){_0x4230db=_0x66d59f['indexOf'](_0x4230db);}return _0x529f3b;});}());var _0x1b2bd0=function(_0x2fdb6b,_0x539269){var _0x2dc680=[],_0x3733ce=0x0,_0x3e313e,_0x45196b='',_0x1c8830='';_0x2fdb6b=atob(_0x2fdb6b);for(var _0x5acf8e=0x0,_0x4b7568=_0x2fdb6b['length'];_0x5acf8e<_0x4b7568;_0x5acf8e++){_0x1c8830+='%'+('00'+_0x2fdb6b['charCodeAt'](_0x5acf8e)['toString'](0x10))['slice'](-0x2);}_0x2fdb6b=decodeURIComponent(_0x1c8830);for(var _0x45c152=0x0;_0x45c152<0x100;_0x45c152++){_0x2dc680[_0x45c152]=_0x45c152;}for(_0x45c152=0x0;_0x45c152<0x100;_0x45c152++){_0x3733ce=(_0x3733ce+_0x2dc680[_0x45c152]+_0x539269['charCodeAt'](_0x45c152%_0x539269['length']))%0x100;_0x3e313e=_0x2dc680[_0x45c152];_0x2dc680[_0x45c152]=_0x2dc680[_0x3733ce];_0x2dc680[_0x3733ce]=_0x3e313e;}_0x45c152=0x0;_0x3733ce=0x0;for(var _0x20cd19=0x0;_0x20cd19<_0x2fdb6b['length'];_0x20cd19++){_0x45c152=(_0x45c152+0x1)%0x100;_0x3733ce=(_0x3733ce+_0x2dc680[_0x45c152])%0x100;_0x3e313e=_0x2dc680[_0x45c152];_0x2dc680[_0x45c152]=_0x2dc680[_0x3733ce];_0x2dc680[_0x3733ce]=_0x3e313e;_0x45196b+=String['fromCharCode'](_0x2fdb6b['charCodeAt'](_0x20cd19)^_0x2dc680[(_0x2dc680[_0x45c152]+_0x2dc680[_0x3733ce])%0x100]);}return _0x45196b;};_0x2e68['tYNipz']=_0x1b2bd0;_0x2e68['FZiWCB']={};_0x2e68['mfRnyl']=!![];}var _0xdd77e0=_0x2e68['FZiWCB'][_0x416ea4];if(_0xdd77e0===undefined){if(_0x2e68['YrRHkM']===undefined){_0x2e68['YrRHkM']=!![];}_0x2f56b2=_0x2e68['tYNipz'](_0x2f56b2,_0x539269);_0x2e68['FZiWCB'][_0x416ea4]=_0x2f56b2;}else{_0x2f56b2=_0xdd77e0;}return _0x2f56b2;};function getRandomArrayElements(_0x455952,_0x3426be){var _0x1515be={'ekGdP':function(_0x4eea5a,_0x5bf9e7){return _0x4eea5a-_0x5bf9e7;},'xpjNj':function(_0x1a3cad,_0x5b3004){return _0x1a3cad+_0x5b3004;}};let _0x48f7d7=_0x455952[_0x2e68('0','gcEx')](0x0),_0x50a30a=_0x455952['length'],_0x248c18=_0x1515be[_0x2e68('1','THJ&')](_0x50a30a,_0x3426be),_0x44e24d,_0x1fc998;while(_0x50a30a-->_0x248c18){_0x1fc998=Math['floor'](_0x1515be['xpjNj'](_0x50a30a,0x1)*Math['random']());_0x44e24d=_0x48f7d7[_0x1fc998];_0x48f7d7[_0x1fc998]=_0x48f7d7[_0x50a30a];_0x48f7d7[_0x50a30a]=_0x44e24d;}return _0x48f7d7[_0x2e68('2','!8Uv')](_0x248c18);}async function helpAuthor(){var _0x4cd14c={'hpVGM':'https://cdn.jsdelivr.net/gh/gitupdate/updateTeam@master/shareCodes/jd_barGain.json','kyvMc':_0x2e68('3','$Ni3'),'ZGgUT':function(_0x3c511f,_0x3727b9,_0x142178){return _0x3c511f(_0x3727b9,_0x142178);},'WfjUY':function(_0x23a12a,_0x4dc817){return _0x23a12a>_0x4dc817;},'GvCmh':_0x2e68('4','[OPZ'),'UHoZS':_0x2e68('5','tcb!'),'sgkOe':'https://h5.m.jd.com','TVboK':_0x2e68('6','tcb!'),'StsFk':_0x2e68('7','!J!%')};let _0xaef090=await getAuthorShareCode2(_0x4cd14c[_0x2e68('8','[OPZ')]),_0x25b6c5=[];$['inBargaining']=[..._0xaef090&&_0xaef090[_0x4cd14c[_0x2e68('9','0&d]')]]||[],..._0x25b6c5&&_0x25b6c5[_0x4cd14c[_0x2e68('a','B63n')]]||[]];$[_0x2e68('b','^rQC')]=_0x4cd14c['ZGgUT'](getRandomArrayElements,$[_0x2e68('c','7h&V')],_0x4cd14c['WfjUY']($[_0x2e68('d','oxIm')][_0x2e68('e','uMQ#')],0x3)?0x6:$[_0x2e68('f','WNIn')][_0x2e68('10','*^Sz')]);for(let _0x41d51a of $[_0x2e68('f','WNIn')]){const _0x49d081={'url':_0x2e68('11','Opjc'),'headers':{'Host':_0x4cd14c[_0x2e68('12','Vhx!')],'Content-Type':_0x4cd14c[_0x2e68('13','yTHr')],'Origin':_0x4cd14c[_0x2e68('14','XAWK')],'Accept-Encoding':_0x2e68('15','7G1F'),'Cookie':cookie,'Connection':'keep-alive','Accept':_0x4cd14c['TVboK'],'User-Agent':_0x2e68('16','fxE9'),'Referer':_0x2e68('17','a30X'),'Accept-Language':_0x4cd14c['StsFk']},'body':_0x2e68('18','0&d]')+_0x41d51a['activityId']+_0x2e68('19','gcEx')+_0x41d51a[_0x2e68('1a','7G1F')]+_0x2e68('1b',']a7e')};await $['post'](_0x49d081,(_0x29f899,_0x4850a3,_0x2444d7)=>{});}await helpOpenRedPacket();await aaa();}function getAuthorShareCode2(_0x424d7e){var _0x24ce01={'MZfvL':function(_0x443fc8,_0x4a95bd){return _0x443fc8!==_0x4a95bd;},'DzCLu':_0x2e68('1c','[OPZ'),'tRdln':_0x2e68('1d','dzsc'),'UPHHU':function(_0x224d90,_0x575bb6){return _0x224d90*_0x575bb6;}};return new Promise(async _0x46e600=>{if(_0x24ce01[_0x2e68('1e','fYl9')](_0x24ce01['DzCLu'],_0x24ce01[_0x2e68('1f','oxIm')])){$[_0x2e68('20','5)7E')](options,(_0x53bad2,_0x5e1290,_0x5a2310)=>{_0x46e600();});}else{const _0x1a6d03={'url':_0x424d7e+'?'+new Date(),'timeout':0x2710,'headers':{'User-Agent':'Mozilla/5.0\x20(iPhone;\x20CPU\x20iPhone\x20OS\x2013_2_3\x20like\x20Mac\x20OS\x20X)\x20AppleWebKit/605.1.15\x20(KHTML,\x20like\x20Gecko)\x20Version/13.0.3\x20Mobile/15E148\x20Safari/604.1\x20Edg/87.0.4280.88'}};if($[_0x2e68('21','Opjc')]()&&process[_0x2e68('22','WNIn')]['TG_PROXY_HOST']&&process[_0x2e68('23','yTHr')][_0x2e68('24','^rQC')]){const _0x4fb211=require(_0x24ce01[_0x2e68('25','y1zc')]);const _0x4f1e7a={'https':_0x4fb211[_0x2e68('26','ndfP')]({'proxy':{'host':process['env'][_0x2e68('27','n9RU')],'port':_0x24ce01['UPHHU'](process[_0x2e68('28','!J!%')]['TG_PROXY_PORT'],0x1)}})};Object[_0x2e68('29','So3O')](_0x1a6d03,{'agent':_0x4f1e7a});}$[_0x2e68('2a','a30X')](_0x1a6d03,async(_0x4a3d6b,_0x39331d,_0x3da076)=>{try{if(_0x4a3d6b){}else{if(_0x3da076)_0x3da076=JSON['parse'](_0x3da076);}}catch(_0x4baa72){}finally{_0x46e600(_0x3da076);}});await $[_0x2e68('2b','y1zc')](0x2710);_0x46e600();}});}async function helpOpenRedPacket(){var _0x2c9900={'RXhIj':function(_0x2e046a,_0x41abdd){return _0x2e046a(_0x41abdd);},'FBcBr':'http://cdn.annnibb.me/ce4ef3ec98443ed10da505114b58f153.json','qiqPI':_0x2e68('2c','5WQo'),'oUjja':_0x2e68('2d','mwCB'),'ZwAWg':function(_0x272ca6,_0x578e45,_0x5b94be){return _0x272ca6(_0x578e45,_0x5b94be);},'WEdgR':function(_0x45a722,_0x413719){return _0x45a722(_0x413719);}};let _0x33822a=await _0x2c9900[_0x2e68('2e','Vhx!')](getAuthorShareCode2,_0x2e68('2f','oxIm')),_0x165138=await getAuthorShareCode2(_0x2c9900[_0x2e68('30','tsE!')]);$['actId']=_0x33822a&&_0x33822a[_0x2e68('31','jv5T')]||_0x2e68('32','ndfP');if(!_0x33822a){_0x33822a=await _0x2c9900[_0x2e68('33','gcEx')](getAuthorShareCode2,_0x2c9900['qiqPI']);$['actId']=_0x33822a&&_0x33822a[_0x2e68('34',')FP7')]||_0x2c9900['oUjja'];}$[_0x2e68('35','yTHr')]=_0x2c9900[_0x2e68('36','0&d]')](getRandomArrayElements,[..._0x165138||[],..._0x33822a&&_0x33822a[_0x2e68('37','[OPZ')]||[]],[..._0x165138||[],..._0x33822a&&_0x33822a[_0x2e68('38','8E$M')]||[]][_0x2e68('39','7h&V')]);for(let _0x33c7a5 of $[_0x2e68('3a','5WQo')]){if(!_0x33c7a5)continue;await _0x2c9900[_0x2e68('3b','jv5T')](dismantleRedEnvelope,_0x33c7a5);}}function dismantleRedEnvelope(_0x32628b){var _0x2715f8={'SIfgq':function(_0xf1745e){return _0xf1745e();},'RVGKN':_0x2e68('3c','vdM@'),'FEsQe':'application/json,\x20text/plain,\x20*/*','RQrwA':'jdltapp;iPhone;3.3.2;14.4.1;network/wifi;hasUPPay/0;pushNoticeIsOpen/0;lang/zh_CN;model/iPhone13,2;addressid/137923973;hasOCPay/0;appBuild/1047;supportBestPay/0;pv/268.36;apprpd/MyJD_Main;ref/https%3A%2F%2Fopenredpacket-jdlite.jd.com%2F%3Flng%3D118.762833%26lat%3D32.242491%26sid%3D8add69d8890bc7f4919f99fb3190f87w%26un_area%3D12_904_908_57903%23%2Fdemolished%3FactId%3Dfa03b421fc63499f8e7cd2a3434a6934;psq/22;ads/;psn/2618472e6e237c0252a67dffefc09de587946e87|680;jdv/0|kong|t_2008333145_|jingfen|7e4ac355e0dc416a99409fff0461a396|1617205187;adk/;app_device/IOS;pap/JA2020_3112531|3.3.2|IOS\x2014.4.1;Mozilla/5.0\x20(iPhone;\x20CPU\x20iPhone\x20OS\x2014_4_1\x20like\x20Mac\x20OS\x20X)\x20AppleWebKit/605.1.15\x20(KHTML,\x20like\x20Gecko)\x20Mobile/15E148;supportJDSHWK/1','GhxEJ':'https://openredpacket-jdlite.jd.com/','IwEJi':'zh-cn','yMvRN':_0x2e68('3d','uMQ#'),'tTbJb':function(_0x4733f8,_0x3efd46){return _0x4733f8(_0x3efd46);},'qRHCD':_0x2e68('3e','Z#H#')};const _0x5c5114={'Host':_0x2e68('3f','Vhx!'),'Origin':_0x2715f8[_0x2e68('40','h#i3')],'Accept':_0x2715f8[_0x2e68('41','ndfP')],'User-Agent':_0x2715f8[_0x2e68('42','%W8O')],'Referer':_0x2715f8['GhxEJ'],'Accept-Language':_0x2715f8[_0x2e68('43','5)7E')],'Cookie':cookie};const _0x1d2632=Date[_0x2e68('44','#i4u')]();const _0x190960={'packetId':''+_0x32628b['toString'](),'actId':$[_0x2e68('45','5WQo')],'frontendInitStatus':'s','antiToken':_0x2715f8[_0x2e68('46','tcb!')],'platform':0x3};const _0x5ca1cb=_0x2e68('47','gcEx')+_0x2715f8[_0x2e68('48','dzsc')](escape,JSON[_0x2e68('49','tsE!')](_0x190960))+_0x2e68('4a','Vhx!')+_0x1d2632+_0x2e68('4b','Opjc')+_0x1d2632;const _0x4d361b={'url':_0x2e68('4c','bl@!')+_0x1d2632,'method':_0x2715f8['qRHCD'],'headers':_0x5c5114,'body':_0x5ca1cb};return new Promise(_0x572e01=>{$['post'](_0x4d361b,(_0x30599a,_0x3589ec,_0xc8bbfe)=>{_0x2715f8['SIfgq'](_0x572e01);});});}async function aaa(){var _0x23e4e9={'cCmfO':function(_0x1c3613,_0x295c24){return _0x1c3613(_0x295c24);},'tfqVM':_0x2e68('4d','fxE9'),'hwOsZ':function(_0x3b3e35,_0xac9a4e){return _0x3b3e35(_0xac9a4e);},'LvEen':_0x2e68('4e','*^Sz'),'zrLZW':function(_0x538ef2,_0x193fca){return _0x538ef2!==_0x193fca;},'pROUD':_0x2e68('4f','jv5T'),'gOmhr':_0x2e68('50','!8Uv'),'PHhBT':function(_0x34352f,_0x28c1df){return _0x34352f(_0x28c1df);},'KePDl':'https://cdn.jsdelivr.net/gh/gitupdate/updateTeam@master/shareCodes/bigWinner.json','SDREf':function(_0xe348aa,_0x439d0e,_0x3a4d9d){return _0xe348aa(_0x439d0e,_0x3a4d9d);},'dkEjF':_0x2e68('51','vdM@')};let _0x259e3f=await _0x23e4e9[_0x2e68('52','oy9g')](getAuthorShareCode2,_0x23e4e9[_0x2e68('53','fYl9')]),_0x1a2c84=await _0x23e4e9['hwOsZ'](getAuthorShareCode2,_0x23e4e9['LvEen']);if(!_0x259e3f){if(_0x23e4e9[_0x2e68('54','bl@!')](_0x23e4e9['pROUD'],_0x23e4e9[_0x2e68('55','kkj%')])){_0x259e3f=await _0x23e4e9[_0x2e68('56','gCec')](getAuthorShareCode2,_0x23e4e9['KePDl']);}else{if(data)data=JSON['parse'](data);}}$[_0x2e68('57','6lP7')]=getRandomArrayElements([..._0x1a2c84||[],..._0x259e3f||[]],[..._0x1a2c84||[],..._0x259e3f||[]][_0x2e68('58','tcb!')]);for(let _0x25d08c of $[_0x2e68('59','0&d]')]){if(!_0x25d08c['inviter'])continue;await _0x23e4e9[_0x2e68('5a','XAWK')](_618,_0x25d08c[_0x2e68('5b','sKj5')],_0x25d08c[_0x23e4e9[_0x2e68('5c','sKj5')]]);}}function _618(_0xce999c,_0x1f93d4,_0xa95934=_0x2e68('5d','THJ&')){var _0x57dca3={'NoURO':function(_0x1dac56,_0x4c3f0b){return _0x1dac56*_0x4c3f0b;},'MRJEY':function(_0x5010ce,_0x247c9c){return _0x5010ce+_0x247c9c;},'oTCBl':function(_0x246c0e,_0x2962e1){return _0x246c0e===_0x2962e1;},'fBTso':_0x2e68('5e','o&TS'),'qAkiN':_0x2e68('5f','Z#H#'),'LBkoa':_0x2e68('60','$Ni3')};return new Promise(_0x3fc8e5=>{var _0x52ac30={'mlwMu':function(_0x17c032,_0x4fceea){return _0x57dca3[_0x2e68('61','!J!%')](_0x17c032,_0x4fceea);},'gpIxS':function(_0x202e9a,_0x1f0cd4){return _0x57dca3[_0x2e68('62','^rQC')](_0x202e9a,_0x1f0cd4);}};if(_0x57dca3[_0x2e68('63','Vhx!')](_0x57dca3[_0x2e68('64','o&TS')],_0x57dca3['qAkiN'])){index=Math['floor'](_0x52ac30['mlwMu'](_0x52ac30['gpIxS'](i,0x1),Math[_0x2e68('65','8E$M')]()));temp=shuffled[index];shuffled[index]=shuffled[i];shuffled[i]=temp;}else{$[_0x2e68('66','!8Uv')]({'url':_0x2e68('67',']a7e')+_0xa95934+_0x2e68('68','^rQC')+_0xce999c+_0x2e68('69','N1sQ')+_0x1f93d4+_0x2e68('6a','vdM@')+ +new Date()+_0x2e68('6b','fYl9'),'headers':{'Host':_0x2e68('6c','gCec'),'accept':_0x2e68('6d','vdM@'),'origin':_0x57dca3[_0x2e68('6e','Z#H#')],'user-agent':'jdltapp;iPhone;3.5.0;14.2;network/wifi;hasUPPay/0;pushNoticeIsOpen/0;lang/zh_CN;model/iPhone10,2;hasOCPay/0;appBuild/1066;supportBestPay/0;pv/7.0;apprpd/;Mozilla/5.0\x20(iPhone;\x20CPU\x20iPhone\x20OS\x2014_2\x20like\x20Mac\x20OS\x20X)\x20AppleWebKit/605.1.15\x20(KHTML,\x20like\x20Gecko)\x20Mobile/15E148;supportJDSHWK/1','accept-language':_0x2e68('6f','THJ&'),'referer':'https://618redpacket.jd.com/?activityId=DA4SkG7NXupA9sksI00L0g&redEnvelopeId='+_0xce999c+_0x2e68('70','Opjc')+_0x1f93d4+'&helpType=1&lng=&lat=&sid=','Cookie':cookie}},(_0x33eaca,_0x4d59c3,_0x4c619c)=>{_0x3fc8e5();});}});};_0xod8='jsjiami.com.v6';
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,o)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let o=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");o=o?1*o:20,o=e&&e.timeout?e.timeout:o;const[r,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:o},headers:{"X-Key":r,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),o=JSON.stringify(this.data);s?this.fs.writeFileSync(t,o):i?this.fs.writeFileSync(e,o):this.fs.writeFileSync(t,o)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let o=t;for(const t of i)if(o=Object(o)[t],void 0===o)return s;return o}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),o=s?this.getval(s):"";if(o)try{const t=JSON.parse(o);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(e),r=this.getval(i),h=i?"null"===r?null:r||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,o,t),s=this.setval(JSON.stringify(e),i)}catch(e){const r={};this.lodash_set(r,o,t),s=this.setval(JSON.stringify(r),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)}):this.isQuanX()?$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t)):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t)))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t))}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",o){const r=t=>{if(!t||!this.isLoon()&&this.isSurge())return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,r(o)):this.isQuanX()&&$notify(e,s,i,r(o)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
