#!/bin/bash

echo "🧪 启动所有测试项目"
echo "===================="
echo ""

# 检查依赖是否已安装
check_deps() {
    local dir=$1
    if [ ! -d "$dir/node_modules" ]; then
        echo "⚠️  $dir 依赖未安装，正在安装..."
        cd "$dir" && npm install && cd ..
        echo "✅ $dir 依赖安装完成"
    else
        echo "✅ $dir 依赖已安装"
    fi
}

# 检查所有测试项目的依赖
check_deps "vue3"
check_deps "react"
check_deps "nuxt3"

echo ""
echo "🚀 启动测试项目..."
echo ""

# 使用 tmux 或在后台启动多个项目
if command -v tmux &> /dev/null; then
    echo "使用 tmux 启动多个测试项目"
    echo ""
    
    # 创建新的 tmux 会话
    tmux new-session -d -s waterfall-test
    
    # Vue 3
    tmux rename-window -t waterfall-test:0 'vue3'
    tmux send-keys -t waterfall-test:0 'cd tests/vue3 && npm run dev' C-m
    
    # React
    tmux new-window -t waterfall-test -n 'react'
    tmux send-keys -t waterfall-test:1 'cd tests/react && npm run dev' C-m
    
    # Nuxt 3
    tmux new-window -t waterfall-test -n 'nuxt3'
    tmux send-keys -t waterfall-test:2 'cd tests/nuxt3 && npm run dev' C-m
    
    echo "✅ 所有测试项目已启动"
    echo ""
    echo "访问地址:"
    echo "  Vue 3:  http://localhost:5180"
    echo "  React:  http://localhost:5181"
    echo "  Nuxt 3: http://localhost:3003"
    echo ""
    echo "使用 'tmux attach -t waterfall-test' 查看所有窗口"
    echo "使用 Ctrl+B, W 在窗口间切换"
    echo "使用 'tmux kill-session -t waterfall-test' 停止所有测试"
    
else
    echo "⚠️  未安装 tmux，将在后台启动项目"
    echo ""
    echo "请分别在3个终端中运行:"
    echo "  1. cd tests/vue3 && npm run dev"
    echo "  2. cd tests/react && npm run dev"
    echo "  3. cd tests/nuxt3 && npm run dev"
    echo ""
    echo "或使用以下命令:"
    echo "  npm run test:vue3"
    echo "  npm run test:react"
    echo "  npm run test:nuxt3"
fi

