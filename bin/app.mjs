#!/usr/bin/env node

import glob from 'glob'
import colors from 'colors';
import appRoot from 'app-root-path'
import fs from 'fs';
import path from 'path';
import { jsonc } from 'jsonc';


import forEachJson from '../utils/forEachJson.mjs';
import inquireCmd from '../utils/inquireCmd.mjs'
import runRplace from './main.mjs';


const __dirname = path.resolve();

function run (){
    glob("*", {}, async function (er, files) {
        if (!er) {
            const {
                atomicFilePath,
                targetPath
            } = await inquireCmd(files)
            /* 匹配原子文件路径 */
            let filePath = ''
            if (/^\//.test(atomicFilePath)) {
                filePath = atomicFilePath.substring(1)
                filePath = path.resolve(appRoot.path, filePath)
            } else {
                filePath = path.resolve(__dirname, atomicFilePath)
            }
            /* 校验原子化文件 */
            let fileStat;
            let appCssFile 
            try {
                fileStat = fs.statSync(filePath);
                if (fileStat.isDirectory()) {
                    console.log(colors.red(`[css2atomic]:  原子化样式文件不能是文件夹！`))
                    return
                }
                let fileType = filePath.split('.').pop();
                if (!/wxss|less|scss|css/.test(fileType)) {
                    console.log(colors.red(`[css2atomic]:  所选文件不是样式文件！期望值[wxss|less|scss|css]`))
                    return
                }
                appCssFile = fs.readFileSync(filePath,'utf-8');
    
            } catch (e) {
                console.log(colors.red(`[css2atomic]:  获取原子化样式文件失败！\n ${e.toString()}`))
                return;
            }
            /* 校验目标样式文件 */
            let targetFileStat;
            let targetFilePath = path.resolve(__dirname, targetPath)
            try {
                targetFileStat = fs.statSync(targetFilePath);
            } catch (e) {
                console.log(colors.red(`[css2atomic]:  获取目标样式文件失败！\n ${e.toString()}`))
                return;
            }
            let jsonList = []
            if (targetFileStat.isDirectory()) {
                jsonList = await forEachJson(targetFilePath)
            } else {
                let fileType = targetFilePath.split('.').pop();
                if (fileType !== 'json') {
                    console.log(colors.red(`[css2atomic]:  只能选择目标样式对应的json或文件夹`))
                    return
                }
                let content
                try {
                    content = fs.readFileSync(targetFilePath).toString();
                    jsonList.push({
                        path: targetFilePath,
                        components: jsonc.parse(content).usingComponents
                    })
                } catch (e) {
                    console.log(colors.red(`[css2atomic]:  目标样式文件对应json文件读取错误\n${e.toString()}`))
                }
            }
    
            for (let i = 0; i < jsonList.length; i++) {
                let item = jsonList[i]
                console.log(colors.green(`\n[css2atomic]:  开始分析Page ==> ${item.path}`))
                await runRplace({
                    url: item.path,
                    components: item.components,
                    appCssFile
                })
            }
        }
    })
}


export default run