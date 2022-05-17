
import fs from 'fs'
import path from 'path';
import ProgressBar from './progressBar.mjs';

/**
 * [printDirSync 同步遍历指定文件夹下的所有文件（夹），支持遍历结束回调 onComplete]
 * @param {*} dirPath
 * @param {*} options {
    allowExts: [], //指定需要的文件类型的路径，不指定则默认允许所有类型（不同于文件夹，文件类型太多，用忽略的方式太麻烦，所以用了允许）
    ignoreDirs: [],//指定不需要读取的文件路径，不指定则默认读取所有文件夹
    onFile: (fileDir, ext, stats) => {},
    onError: (fileDir, err) => {},
    onComplete: (fileNum) => {},
  }
 */
function printDirSync(
  dirPath,
  options = {
    allowExts: [],
    ignoreDirs: [],
    onFile: (fileDir, ext, stats) => {},
    onError: (fileDir, err) => {},
    onComplete: (filePaths) => {},
  }
) {
  const { allowExts, ignoreDirs, onFile, onComplete, onError } = options;
  let onPrintingNum = 0; //记录正在遍历的文件夹数量，用来判断是否所有文件遍历结束
  let findFiles = []; //统计所有文件，在onComplete中返回
  let count = 0; // 读取文件的次数
  let pb = new ProgressBar('文件读取进度', 0);

  // 因为fs.stat是异步方法，通过回调的方式返回结果，不可控的执行顺序影响是【否遍历结束】的判断
  // 所以这里返回promise，配合sync/await模拟同步执行
  const stat = (__path__) => {
    return new Promise((resolve, reject) => {
      fs.stat(__path__, function (err, stats) {
        if (err) {
          console.log(colors.red(`[css2atomic]:  获取文件stats失败\n${err.toString()}`))
          if (onError && typeof onError == "function") {
            onError(__path__, err);
          }
        } else {
          if (stats.isFile()) {
            const names = __path__.split(".");
            const ext = names[names.length - 1];

            // 对文件的处理回调，可通过allowExts数组过滤指定需要的文件类型的路径，不指定则默认允许所有类型
            if (
              !allowExts ||
              allowExts.length == 0 ||
              (allowExts.length && allowExts.includes(ext))
            ) {
              if (onFile && typeof onFile == "function") {
                pb.render({ completed: count++, total: findFiles.length });
                findFiles.push(__path__);
                onFile(__path__, ext, stats);
              }

            }
          }

          // 这里是对文件夹的回调，可通过ignoreDirs数组过滤不想遍历的文件夹路径
          if (stats.isDirectory()) {
            if (
              !ignoreDirs ||
              ignoreDirs.length == 0 ||
              (ignoreDirs.length && !ignoreDirs.includes(__path__))
            ) {
              print(__path__); //递归遍历
            }
          }
        }

        resolve(__path__ + "  stat结束");
      });
    });
  };

  // 处理正在遍历的文件夹遍历结束的逻辑：onPrintingNum-1 且 判断整体遍历是否结束
  const handleOnPrintingDirDone = () => {
    if (--onPrintingNum == 0) {
      if (onComplete && typeof onComplete == "function") {
        onComplete(findFiles);
      }
    }
  };

  // 遍历路径，记录正在遍历路径的数量
  const print = async (filePath) => {
    onPrintingNum++; //进入到这里，说明当前至少有一个正在遍历的文件夹，因此 onPrintingNum+1
 

    let files = fs.readdirSync(filePath); //同步读取filePath的内容
    let fileLen = files.length;

    // 如果是空文件夹，不需要遍历，也说明当前正在遍历的文件夹结束了，onPrintingNum-1
    if (fileLen == 0) {
      handleOnPrintingDirDone();
    }

    //遍历目录下的所有文件
    for (let index = 0; index < fileLen; index++) {
      let file = files[index];
      let fileDir = path.join(filePath, file); //获取当前文件绝对路径

      try {
        await stat(fileDir); //同步执行路径信息的判断

        // 当该文件夹下所有文件（路径）都遍历完毕，也说明当前正在遍历的文件夹结束了，onPrintingNum-1
        if (index == fileLen - 1) {
          handleOnPrintingDirDone();
        }
      } catch (err) {}
    }
  };

  print(dirPath);
}

export default printDirSync