#!/usr/bin/env node

/**
 * 检查Vercel部署是否包含最新功能的脚本
 */

const https = require('https');

// Vercel网站URL - 更新为正确的域名
const VERCEL_URL = 'https://www.dawuls.com';

console.log('🔍 检查Vercel部署状态...\n');

function checkDeployment() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(VERCEL_URL).hostname,
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Deployment-Checker)',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

async function main() {
  try {
    console.log(`📡 正在检查: ${VERCEL_URL}`);
    
    const response = await checkDeployment();
    
    console.log(`✅ 响应状态: ${response.statusCode}`);
    console.log(`🕒 最后修改时间: ${response.headers['last-modified'] || '未知'}`);
    console.log(`🏷️  ETag: ${response.headers.etag || '未知'}`);
    
    // 检查是否包含复制和导出功能的关键词
    const hasMessageActions = response.body.includes('message-actions') || 
                             response.body.includes('MessageActions') ||
                             response.body.includes('复制') ||
                             response.body.includes('导出Word');
    
    const hasDocxDependency = response.body.includes('docx') || 
                             response.body.includes('file-saver');
    
    console.log('\n📦 功能检查结果:');
    console.log(`  📋 消息操作组件: ${hasMessageActions ? '✅ 已部署' : '❌ 未找到'}`);
    console.log(`  📄 Word导出依赖: ${hasDocxDependency ? '✅ 已加载' : '❌ 未找到'}`);
    
    if (hasMessageActions && hasDocxDependency) {
      console.log('\n🎉 恭喜！最新功能已成功部署到Vercel！');
    } else {
      console.log('\n⚠️  部署可能还未完成或存在缓存问题');
      console.log('\n🔧 建议解决方案:');
      console.log('   1. 等待3-5分钟让Vercel完成构建和CDN刷新');
      console.log('   2. 清除浏览器缓存或使用无痕浏览模式');
      console.log('   3. 检查Vercel Dashboard的部署状态');
      console.log('   4. 手动触发重新部署');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.log('\n🔧 可能的原因:');
    console.log('   1. 网络连接问题');
    console.log('   2. Vercel网站暂时不可访问');
    console.log('   3. 域名配置问题');
  }
}

main(); 