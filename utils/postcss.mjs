/*
 * @Author: baojun.hu baojun.hu@weimob.com
 * @Date: 2022-05-06 10:52:32
 * @LastEditors: baojun.hu baojun.hu@weimob.com
 * @LastEditTime: 2022-05-16 00:12:21
 * @FilePath: \replaceReply\worker\pstcss.worker.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import postcss from "postcss";
import toCss from 'to-css'
import fs from 'fs'


import cssObjectifier from './cssObjectifier.mjs'



const transformr = (cssText) => {

  const root = postcss.parse(cssText);
  return cssObjectifier(root)

}

export const cssObject2str = (obj) => {
  let text = jsToCss(obj)
  return text
}

const jsToCss = (obj) => {
  let text = '';

  // 处理注释
  const renderComment = (key, value, pixer) => {
    if (/comment__\d{1,}/.test(key)) {
      return (pixer || '') + '/* ' + value + ' */\n'
    } else {
      return ''
    }
  }

  for (let [select, style] of Object.entries(obj)) {


    if (typeof style !== 'object') {
      // 注释 或 @import
      text += renderComment(select, style) || (select + ';\n')
      continue;
    }
    // 被清空的样式
    if (JSON.stringify(style) === '{}') continue;
    text += select + ' {\n'
    for (let [attr, value] of Object.entries(style)) {
      let newAttr = attr.replace(/([A-Z])/g, "-$1").toLowerCase();

      if (Array.isArray(value)) {
        value.forEach((sty) => {
          text += renderComment(newAttr, sty, '  ') || ('  ' + newAttr + ': ' + sty + ';\n')
        })
      } else {
        text += renderComment(newAttr, value, '  ') || ('  ' + newAttr + ': ' + value + ';\n')
      }
    }
    text += '}\n'
  }

  return text
}

const computedSelector = (cssObject, targetCssObject) => {
  let _cssObject_ = Object.assign({}, cssObject)
  let _targetCssObject_ = Object.assign({}, targetCssObject)
  // 原子化文件的选择器和样式集合
  let appStyleArr = [];
  let appSelectorArr = [];
  let appStyleCount = {};
  // 目标文件的选择器和样式集合
  let targetStyleArr = [];
  let targetSelectorArr = [];

  // 原子样式中 并集选择器拆分
  for (let [select, styles] of Object.entries(_cssObject_)) {
    // 只处理并集选择器
    if (!/\,/.test(select)) continue;
    let selectArr = select.split(',');
    selectArr = selectArr.map(item => {
      return item.replace(/\\n/ig, '');
    })
    delete cssObject.select
    cssObject[selectArr[0]] = styles;
  }

  // 目标样式中 并集选择器拆分
  for (let [select, styles] of Object.entries(_targetCssObject_)) {
    // 只处理并集选择器
    if (!/\,/.test(select)) continue;
    let selectArr = select.split(',');
    selectArr.map(item => {
      let newSelect = item.replace(/\\n/ig, '');
      targetCssObject[newSelect] = styles;
    })
    delete targetCssObject.select
  }

  // 拆分 css选择器 和 css属性  
  for (let [select, styles] of Object.entries(cssObject)) {
    if (!/^\./.test(select)) continue;
    // 缓存原子样式分别有多少个属性
    appStyleCount[select] = Object.keys(styles).length;

    for (let [name, value] of Object.entries(styles)) {
      appSelectorArr.push(select);
      appStyleArr.push(name + ':' + value)
    }
  }

  for (let [select, styles] of Object.entries(targetCssObject)) {
    for (let [name, value] of Object.entries(styles)) {
      targetSelectorArr.push(select);
      targetStyleArr.push(name + ':' + value);
    }
  }

  return {
    // 原子化文件的选择器和样式集合
    appStyleArr,
    appSelectorArr,
    appStyleCount,
    // 目标文件的选择器和样式集合
    targetStyleArr,
    targetSelectorArr
  }

}

const computedResult = (cssData, cssObject, targetCssObject) => {

  let {
    // 原子化文件的选择器和样式集合
    appStyleArr,
    appSelectorArr,
    appStyleCount,
    // 目标文件的选择器和样式集合
    targetStyleArr,
    targetSelectorArr
  } = cssData

  // 缓存 style匹配到相同结果的集合
  let sameReslut = {}
  // 最终结果的集合
  let result = []

  appStyleArr.forEach((appStyle, index) => {

    let indexOf = targetStyleArr.indexOf(appStyle);
    if (indexOf === -1) return
    // 当前需要匹配的原子化 选择器
    let curAppSelector = appSelectorArr[index];

    curAppSelector = curAppSelector.split('\n')[0].split(',')[0];

    // 目标文件中的 对应的选择器
    let curTargetSelector = targetSelectorArr[indexOf];

    let key = curAppSelector + '=>' + curTargetSelector

    // 计算匹配到的次数  
    sameReslut[key] = sameReslut[key] ? (sameReslut[key] + 1) : 1;

    // 原子样式的属性条数  和 匹配到的条数相等才需要替换 
    // 目标选择器 包含原子样式
    // 伪类不匹配
    if (sameReslut[key] === appStyleCount[curAppSelector] && !/:+/.test(curTargetSelector)) {

      let appSelectorStyleKeys = Object.keys(cssObject[curAppSelector])

      // 目标样式文件中 需要删除的属性
      appSelectorStyleKeys.forEach(arrtname => {
        delete targetCssObject[curTargetSelector][arrtname]
      })


      result.push({
        appSelector: curAppSelector,
        targetSelector: curTargetSelector,
        targetAttrCount: Object.keys(targetCssObject[curTargetSelector]).length
      })
    }


  })
  return result
}

export default (appCssFiles = [], targetCssFile) => {

  let cssObject = {};
  let targetCssObject = {}

  for (let i = 0; i < appCssFiles.length; i++) {
    cssObject = Object.assign(
      cssObject,
      transformr(appCssFiles[i].toString())
    );
  }

  targetCssObject = transformr(targetCssFile.toString());
  // 获取基本数据
  let cssData = computedSelector(cssObject, targetCssObject)
  // 根据基础数据计算出可以删除的样式
  let cssReult = computedResult(cssData, cssObject, targetCssObject);


  return {
    cssReult,
    cssObject,
    targetCssObject
  }


}
