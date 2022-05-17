/*
 * @Author: baojun.hu baojun.hu@weimob.com
 * @Date: 2022-05-15 10:21:28
 * @LastEditors: baojun.hu baojun.hu@weimob.com
 * @LastEditTime: 2022-05-15 10:27:31
 * @FilePath: \replaceReply\utils\cssObjectifier.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import camelcase  from'camelcase-css'

let UNITLESS = {
  boxFlex: true,
  boxFlexGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  strokeDashoffset: true,
  strokeOpacity: true,
  strokeWidth: true
}
let commentCount = 0;
function atRule(node) {
  if (typeof node.nodes === 'undefined') {
    return true
  } else {
    return process(node)
  }
}

function process(node) {
  let name
  let result = {}

  node.each(child => {
    if (child.type === 'atrule') {
      name = '@' + child.name
      if (child.params) name += ' ' + child.params
      if (typeof result[name] === 'undefined') {
        result[name] = atRule(child)
      } else if (Array.isArray(result[name])) {
        result[name].push(atRule(child))
      } else {
        result[name] = [result[name], atRule(child)]
      }
    } else if (child.type === 'rule') {
      let body = process(child)
      if (result[child.selector]) {
        for (let i in body) {
          result[child.selector][i] = body[i]
        }
      } else {
        result[child.selector] = body
      }
    } else if (child.type === 'decl') {
      if (child.prop[0] === '-' && child.prop[1] === '-') {
        name = child.prop
      } else {
        name = camelcase(child.prop)
      }
      let value = child.value
      if (!isNaN(child.value) && UNITLESS[name]) {
        value = parseFloat(child.value)
      }
      if (child.important) value += ' !important'
      if (typeof result[name] === 'undefined') {
        result[name] = value
      } else if (Array.isArray(result[name])) {
        result[name].push(value)
      } else {
        result[name] = [result[name], value]
      }
    } else if (child.type === 'comment') {
      name = 'comment__' + commentCount++;
      result[name] = child.text;
    }
  })
  return result
}

export default process
