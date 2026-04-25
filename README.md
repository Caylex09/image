# 个人相册模板

一个纯静态的相册站点模板，适合直接部署到 GitHub Pages。

## 有什么功能

- 首页展示相册列表
- 点击相册进入图文浏览页
- 相册页支持上一张 / 下一张切换和大图预览
- 全站都是静态文件，不需要后端

## 怎么用

```bash
git clone https://github.com/Caylex09/image   # 克隆模板
cd image                                      # 进入项目目录
```

然后改这些文件就行：

- `albums.json`：相册列表
- `album/<相册名>/data.json`：单个相册的图片数据
- `background.jpg`：首页背景图
- `pay_wx.jpg`、`pay_zfb.png`：赞赏码图片（不需要可以删掉相关代码）

## 更新模板

如果你是从这个仓库 clone 下来的，后续直接执行：

```bash
git pull origin main   # 拉取模板最新更新
```

如果你本地有改动，先提交再拉：

```bash
git add .              # 暂存修改
git commit -m "my changes"
git pull origin main   # 合并模板更新
```

## 发布到 GitHub Pages

1. 把仓库推到 GitHub
2. 到 Settings -> Pages 里选择 `main` 分支和根目录 `/`
3. 保存后等待页面生成