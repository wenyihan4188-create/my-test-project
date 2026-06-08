# MyTools

本目录用于集中管理本地小工具。每个大工具独立一个目录，避免依赖、脚本和生成文件混在一起。

## 一键启动

双击根目录下的：

```text
Start-MyTools.bat
```

它会启动 Dashboard，并打开：

```text
http://localhost:4545
```

如果 Dashboard 已经在运行，脚本会直接打开网页。

## 工具清单

### tools-dashboard

本地网页控制台，用来统一管理所有小工具。

主要能力：

- Playwright 录制/回放管理
- API 自动化管理
- 接口压测
- 测试数据生成
- 边界文件生成
- 图片压缩
- 目录树生成

### playwright-recorder

浏览器 UI 自动化录制回放工具。

用途：

- 使用 Playwright 录制网页操作
- 回放单个脚本或全部脚本
- 生成 Playwright 测试报告
- 生成 Trace 并在报告中查看
- 对录制脚本做基础定位增强

### api-tester

接口自动化工具，基于 `pytest + requests`。

用途：

- 新增、编辑、运行接口用例
- 支持环境配置和全局 Headers
- 支持动态变量提取和引用
- 支持 Postman Collection 导入
- 生成接口测试报告
- 在 Dashboard 内查看接口测试摘要
- 支持轻量接口压测

输出目录：

```text
api-tester/reports
```

### data-generator

测试数据生成器。

用途：

- 生成常用测试数据
- 自选字段
- 自定义生成数量
- 导出 CSV
- 生成 SQL Insert 脚本

输出目录：

```text
data-generator/outputs
```

### file-boundary-generator

边界文件生成器，用于上传功能测试。

用途：

- 生成常见格式文件
- 生成空文件
- 生成指定大小文件
- 生成损坏/截断文件
- 生成扩展名伪装文件
- 生成随机二进制文件
- 生成中文、空格、特殊字符、超长、多后缀文件名
- 批量生成常用上传边界组合

输出目录：

```text
file-boundary-generator/outputs
```

### utility-tools

日常小工具集合，放一些不一定是测试专用但经常会用的小功能。

当前包含：

- 图片压缩
- 目录树生成器

目录树输出目录：

```text
utility-tools/outputs
```

图片压缩在浏览器本地完成，压缩后直接下载，不上传到后端。

## 手动启动

如果不使用 `.bat`，也可以手动启动：

```powershell
cd D:\Tool\AI\MyTools\tools-dashboard
npm start
```

然后打开：

```text
http://localhost:4545
```
