/*
 * @Author: baojun.hu baojun.hu@weimob.com
 * @Date: 2022-05-05 18:54:19
 * @LastEditors: baojun.hu baojun.hu@weimob.com
 * @LastEditTime: 2022-05-16 02:07:44
 * @FilePath: \replaceReply\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import fs from 'fs';
import path from 'path';
import jsonc from 'jsonc'
import cheerio from 'cheerio'
import colors from 'colors';
import computedCss, { cssObject2str } from '../utils/postcss.mjs';

const fileCache = [];
const __dirname = path.resolve();




const getGroupFiles = (route, filename) => {
	let nameArr = filename.split('.')
	nameArr.pop();
	let name = nameArr.join('.');

	return {
		wxml: route + '/' + name + '.wxml',
		wxss: route + '/' + name + '.wxss',
		json: route + '/' + name + '.json',
		js: route + '/' + name + '.js'
	}

}


const removePixrt = (str) => {
	return str.replace(/\.|#/ig, '')
}


const runRplace = async ({
	appCssFile,
	url,
	components = {},
	pageCssResult = []
}) => {
	// 避免文件重复执行
	if (fileCache.indexOf(url) > -1) {
		return
	} else {
		fileCache.push(url)
	}

	let filePathArr = url.split('\\')
	let filename = filePathArr.pop()
	let fileRoute = filePathArr.join('/');

	let groupFiles = getGroupFiles(fileRoute, filename)

	let xmlString 
	try{
		xmlString = fs.readFileSync(groupFiles.wxml).toString();
	}catch(e){
		console.log(colors.red(`[css2atomic]:  文件读取失败 (${groupFiles.wxml})`))
		return
	}
	
	let targetCssFile 
	try{
		targetCssFile = fs.readFileSync(groupFiles.wxss).toString();
	}catch(e){
		console.log(colors.red(`[css2atomic]:  文件读取失败 (${groupFiles.wxss})`))
		return
	}

	let $ = cheerio.load(xmlString, {
		xmlMode: true,
		decodeEntities: false,
	});
	let {
		cssReult,
		cssObject,
		targetCssObject
	} = computedCss([
		appCssFile
	], targetCssFile);



	let cssReultConcat = [...cssReult, ...pageCssResult]

	// 根据css结果替换 xml中的选择器
	cssReultConcat.forEach(map => {
		let {
			appSelector,
			targetSelector,
			targetAttrCount // 当前目标选择器中还有多少个属性
		} = map;


		// 取选择器 里最后的选择器
		let lastSelector = targetSelector.split(' ').pop()
		let $dom = $(targetSelector);


		if ($dom.length) {
			$dom.addClass(removePixrt(appSelector))
			// 选择器处理完之后  里面没有样式属性了
			if (!targetAttrCount) {
				$dom.removeClass(removePixrt(lastSelector))
			}

		} else {
			let cleanSelector = removePixrt(targetSelector)
			let reg = new RegExp(`<(.+?)\s.*?="(.*\s)?(${cleanSelector}).*?"`, 'ig')
			let regRes = xmlString.match(reg);
			try {
				if (regRes) {
					let tagName = regRes[0].split(' ')[0].replace('<', '');
					let attrs = $(tagName).attr();
					for (let [attr, value] of Object.entries(attrs)) {
						if (cleanSelector === value) {
							map.targetSelector = '.' + attr
						}
					}
				}
			} catch (e) { }


		}

		// let reg = new RegExp(`class=".*(${lastSelector}).*?"`, 'ig')
		// xmlString = xmlString.replace(reg, ($1) => {
		// 	let str
		// 	if (Object.keys(targetCssObject[targetSelector]).length) {
		// 		str = $1.replace(removePixrt(lastSelector), removePixrt(lastSelector + ' ' + appSelector))
		// 	} else {
		// 		str = $1.replace(removePixrt(lastSelector), '')
		// 	}
		// 	return str

		// })

	})



	let xmlResult = $.xml();

	fs.writeFileSync(groupFiles.wxml, xmlResult, 'utf-8');
	fs.writeFileSync(groupFiles.wxss, cssObject2str(targetCssObject), 'utf-8');

	// 匹配出 本地依赖的组件
	for (let [name, comPath] of Object.entries(components)) {
		if (/^(\.|\/)/.test(comPath)) {

			let jsonUrl = path.resolve(fileRoute, comPath)

			jsonUrl = /\.json/.test(comPath) ? jsonUrl : (jsonUrl + '.json');

			let file;

			try {
				file = fs.readFileSync(jsonUrl, 'utf-8');
			} catch (e) {
				console.log(colors.red(`[css2atomic]:  组件加载错误 \n ${e.toString()}`))
				continue;
			}
			let jsonFile
			try {
				jsonFile = jsonc.parse(file.toString())
			} catch (e) {
				console.log(colors.red(`[css2atomic]:  json文件解析失败！(${jsonUrl})`))
				continue;
			}

			console.log(colors.green(`[css2atomic]:  开始分析组件 ==> ${jsonUrl}`))

			await runRplace({
				components: jsonFile.usingComponents,
				url: jsonUrl,
				pageCssResult: cssReultConcat,
				appCssFile
			})

		}
	}
}


export default runRplace