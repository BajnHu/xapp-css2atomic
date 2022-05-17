/*
 * @Author: baojun.hu baojun.hu@weimob.com
 * @Date: 2022-05-06 19:42:14
 * @LastEditors: baojun.hu baojun.hu@weimob.com
 * @LastEditTime: 2022-05-16 03:03:25
 * @FilePath: \replaceReply\utils\forEachJson.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

// const { fs, printDir, printDirSync } = require("./file-tools");
import printDirSync from './printDirSync.mjs'
import fs from 'fs';
import path from 'path';
import colors from 'colors';
import { jsonc } from 'jsonc';

const forEachJson = (filePath, cb) => {
    let dirPath = filePath;
    let allowExts = ["json"];
    let ignoreDirs = [`${dirPath}/.git`, `${dirPath}/.DS_Store`, `${dirPath}/dist`];
    let jsonFileList = []
    return new Promise(res => {
        let errArr = ''
        printDirSync(dirPath, {
            allowExts,
            ignoreDirs,
            onFile: (fileDir, ext, stats) => {
                try {
                    let fileContent = jsonc.parse(fs.readFileSync(fileDir, "utf-8").toString()); //同步读取文件内容
                    if (!fileContent.component && fileContent.usingComponents) {
                        jsonFileList.push({
                            path: fileDir,
                            components: fileContent.usingComponents
                        })
                    }
                } catch (e) {
                    errArr += `\n[css2atomic]:  json文件解析失败！(${fileDir})`
                }

            },
            onComplete: (files) => {
                console.log(colors.red(errArr))
                res(jsonFileList);
            },
        });
    })

}


export default forEachJson