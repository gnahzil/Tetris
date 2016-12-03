'use strict'

var ROWS = 20;
var COLS = 14;
var CELL_WIDTH = 30;
var CELL_HEIGHT = 30;

var NO_BLOCK = 0;

var curSpeed = 1;
var curScore = 0;
var maxScore = 0;

//标识游戏是否正在进行
var isPlaying = true;

//canvas画板
var tetrisCanvas;
var tetrisCtx;

//定义颜色组
var colors = ["white", "red", "blue", "green", "orange", "yellow", "pink", "black", "grey"];
//固定住的方块颜色
var solidColor = 8;

//掉落计时器
var curTimer;

//固定住的方块
var tetrisStatus = [];

//当前掉落的方块组
var currentBlocks;

//几种可能出现的方块的形状
var blockArr = [
	//第一种:Z
	[
		{ x: COLS/2-1, y: 0, color: 1 },
		{ x: COLS/2, y: 0, color: 1},
		{ x: COLS/2, y: 1, color: 1},
		{ x: COLS/2+1, y: 1, color: 1}
	],
	//第二种：反Z
	[
		{ x: COLS/2, y: 0, color: 2},
		{ x: COLS/2+1, y: 0, color: 2},
		{ x: COLS/2, y: 1, color: 2},
		{ x: COLS/2-1, y: 1, color: 2}
	],
	//第三种：田
	[
		{ x: COLS/2-1, y: 0, color: 3},
		{ x: COLS/2, y: 0, color: 3},
		{ x: COLS/2-1, y: 1, color: 3},
		{ x: COLS/2, y: 1, color: 3}
	],
	//第四种：L
	[
		{ x: COLS/2-1, y: 0, color: 4},
		{ x: COLS/2-1, y: 1, color: 4},
		{ x: COLS/2-1, y: 2, color: 4},
		{ x: COLS/2, y: 2, color: 4}
	],
	//第五种：J
	[
		{ x: COLS/2, y: 0, color: 5},
		{ x: COLS/2, y: 1, color: 5},
		{ x: COLS/2, y: 2, color: 5},
		{ x: COLS/2-1, y: 2, color: 5}
	],
	//第六种：I
	[
		{ x: COLS/2, y: 0, color: 6},
		{ x: COLS/2, y: 1, color: 6},
		{ x: COLS/2, y: 2, color: 6},
		{ x: COLS/2, y: 3, color: 6}
	],
	//第七种：倒T
	[
		{ x: COLS/2, y: 0, color: 7},
		{ x: COLS/2+1, y: 1, color: 7},
		{ x: COLS/2, y: 1, color: 7},
		{ x: COLS/2-1, y: 1, color: 7}
	],
];

window.onload = function() {
	createCanvas(ROWS,COLS,CELL_WIDTH,CELL_HEIGHT);
	document.body.appendChild(tetrisCanvas);
	
	//读取固定方块的值
	var temStatus = localStorage.getItem("tetrisStatus");
	if (temStatus == null)
		initSolidBlock();
	else
		tetrisStatus = JSON.parse(temStatus);
	//把固定方块涂上颜色
	drawBlock();

	//读取speed
	var temp = localStorage.getItem("curSpeed");
	curSpeed = temp == null? curSpeed : temp;
	document.getElementById("curSpeedEle").innerText = curSpeed;
	
	//读取score
	temp = localStorage.getItem("curScore");
	curScore = temp == null? curScore : temp;
	document.getElementById("curScoreEle").innerText = curScore;

	//读取maxScore
	temp = localStorage.getItem("maxScore");
	maxScore = temp == null? maxScore : temp;
	document.getElementById("maxScoreEle").innerText = maxScore;

	//初始化一块掉落的方块组
	initBlock();

	//执行掉落
	curTimer = setInterval("moveDown();", 500/curSpeed);
};

var createCanvas = function(rows, cols, cellWidth, cellHeight) {

	tetrisCanvas = document.createElement("canvas");
	tetrisCanvas.width = cols * cellWidth;
	tetrisCanvas.height = rows * cellHeight;
	tetrisCanvas.style.border = "1px solid black";
	tetrisCtx = tetrisCanvas.getContext('2d');
	tetrisCtx.beginPath();
	for (var i = 0; i < rows; i++) {
		tetrisCtx.moveTo(0, i*cellHeight);
		tetrisCtx.lineTo(cols * cellHeight, i*cellHeight);
	}
	for (var i = 0; i < cols; i++) {
		tetrisCtx.moveTo(i*cellWidth, 0);
		tetrisCtx.lineTo(i*cellWidth, rows*cellWidth);
	}
	tetrisCtx.closePath();
	tetrisCtx.strokeStyle = "#aaa";
	tetrisCtx.lineWidth = 0.3;
	tetrisCtx.stroke();
	return tetrisCanvas
};

//初始化固定住的方块
var initSolidBlock = function() {
	for (let i = 0; i < ROWS; i++) {
		tetrisStatus[i] = [];
		for (let j = 0; j < COLS; j++)
			tetrisStatus[i][j] = NO_BLOCK;
	}
};

//随机取出掉落的方块形状
var initBlock = function() {
	var rand = Math.floor(Math.random() * blockArr.length);
	//这里的取出，其实是复制了数组中的元素，否则方块组旋转的话就更改了原有数组中的元素了
	//这里还只能这么写拷贝，不然无法达到深拷贝
	currentBlocks = [
		{x: blockArr[rand][0].x, y: blockArr[rand][0].y, color: blockArr[rand][0].color},
		{x: blockArr[rand][1].x, y: blockArr[rand][1].y, color: blockArr[rand][1].color},
		{x: blockArr[rand][2].x, y: blockArr[rand][2].y, color: blockArr[rand][2].color},
		{x: blockArr[rand][3].x, y: blockArr[rand][3].y, color: blockArr[rand][3].color},
	];
	//每个方块涂上颜色
	for (let i=0; i<currentBlocks.length; i++) {
		var cur = currentBlocks[i];
		if (tetrisStatus[cur.y][cur.x] == NO_BLOCK) {
			tetrisCtx.fillStyle = colors[cur.color];
			tetrisCtx.fillRect(cur.x * CELL_WIDTH + 1, cur.y * CELL_HEIGHT + 1,
								CELL_WIDTH - 2, CELL_HEIGHT - 2);
		}		
	}
};

var moveDown =  function() {

	if (checkCanDown())
		blocksDown();
	else {
		//遍历方块组固定方块
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			//方块到顶
			if (cur.y < 2) {
				//清空积分
				localStorage.removeItem("curScore");
				localStorage.removeItem("tetrisStatus");
				localStorage.removeItem("curSpeed");

				if (confirm("您已经输了，是否参与排名？")) {
					//读取最高纪录
					if (curScore >= maxScore) {
						localStorage.setItem("maxScore", curScore);
					}
				}

				isPlaying = false;
				clearInterval(curTimer);
				return;
			}
			tetrisStatus[cur.y][cur.x] = solidColor;
			drawBlock();
		}

		//判断是否可以消除行
		//lineFull();

		//记录游戏状态
		localStorage.setItem("tetrisStatus", JSON.stringify(tetrisStatus));
		initBlock();
	}
	
};

var checkCanDown = function() {

	for (let i=0; i<currentBlocks.length; i++) {
		//是否到底
		if (currentBlocks[i].y >= ROWS - 1) {
			return false;
			break;
		}

		var nextY = tetrisStatus[currentBlocks[i].y+1][currentBlocks[i].x];
		//下面是否有方块
		if ( nextY != NO_BLOCK) {
			return false;
			break;
		}
	}
	return true;
};

var blocksDown = function() {

	//先变成白色
	for (let i=0; i<currentBlocks.length; i++) {
		var cur = currentBlocks[i];
		tetrisCtx.fillStyle = colors[0];
		tetrisCtx.fillRect(cur.x * CELL_WIDTH + 1, cur.y * CELL_HEIGHT + 1,
							CELL_WIDTH - 2, CELL_HEIGHT - 2);
	}

	//每个方块下落1格
	for (let i=0; i<currentBlocks.length; i++) {
		var cur = currentBlocks[i];
		cur.y++;
	}

	//每个方块涂上颜色
	for (let i=0; i<currentBlocks.length; i++) {
		var cur = currentBlocks[i];
		tetrisCtx.fillStyle = colors[cur.color];
		tetrisCtx.fillRect(cur.x * CELL_WIDTH + 1, cur.y * CELL_HEIGHT + 1,
							CELL_WIDTH - 2, CELL_HEIGHT - 2);

	}
};

var drawBlock = function() {

	for (let i=0; i<tetrisStatus.length; i++) {
		for (let j=0; j<tetrisStatus[i].length; j++) {
			if (tetrisStatus[i][j] != NO_BLOCK) {
				tetrisCtx.fillStyle = colors[tetrisStatus[i][j]];
				tetrisCtx.fillRect( j * CELL_WIDTH + 1, i * CELL_HEIGHT + 1,
									CELL_WIDTH - 2, CELL_HEIGHT - 2);
			}
		}
	}
};

//绑定键盘事件
window.onkeydown = function(evt) {

	if (!isPlaying)
		return;

	switch(evt.keyCode) {

		//向下的箭头
		case 40:			
			moveDown();
			break;
		//向左的箭头
		case 37:
			moveLeft();
			break;
		//向右的箭头
		case 39:
			moveRight();
			break;
		//向上的箭头
		case 38:
			rotate();
			break;
	}
}

//方块组左移
var moveLeft = function() {

	var canLeft = true;

	for (let i=0; i<currentBlocks.length; i++) {

		//如果到了最左边,或者左边有固定方块
		if (currentBlocks[i].x <= 0 ||
			tetrisStatus[currentBlocks[i].y][currentBlocks[i].x-1] != NO_BLOCK) {
			canLeft = false;
			break;
		}
	}

	if (canLeft) {
		//左移钱每个方块变白色
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			tetrisCtx.fillStyle = colors[NO_BLOCK];
			tetrisCtx.fillRect(cur.x*CELL_WIDTH+1, cur.y*CELL_HEIGHT+1, CELL_WIDTH-2, CELL_HEIGHT-2);
		}

		//左移方块组
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			cur.x--;			
		}

		//左移后的方块组涂上颜色
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			tetrisCtx.fillStyle = colors[cur.color];
			tetrisCtx.fillRect(cur.x*CELL_WIDTH+1, cur.y*CELL_HEIGHT+1, CELL_WIDTH-2, CELL_HEIGHT-2);
		}
	}
}

//方块组右移
var moveRight = function() {

	var canRight = true;

	for (let i=0; i<currentBlocks.length; i++) {

		//如果到了最右边,或者右边有固定方块
		if (currentBlocks[i].x >= COLS-1 ||
			tetrisStatus[currentBlocks[i].y][currentBlocks[i].x+1] != NO_BLOCK) {
			canRight = false;
			break;
		}
	}

	if (canRight) {
		//右移前每个方块变白色
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			tetrisCtx.fillStyle = colors[NO_BLOCK];
			tetrisCtx.fillRect(cur.x*CELL_WIDTH+1, cur.y*CELL_HEIGHT+1, CELL_WIDTH-2, CELL_HEIGHT-2);
		}

		//右移方块组
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			cur.x++;			
		}

		//右移后的方块组涂上颜色
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			tetrisCtx.fillStyle = colors[cur.color];
			tetrisCtx.fillRect(cur.x*CELL_WIDTH+1, cur.y*CELL_HEIGHT+1, CELL_WIDTH-2, CELL_HEIGHT-2);
		}
	}
}

//方块组旋转
var rotate = function() {

	var canRotate = true;

	for (let i=0; i<currentBlocks.length; i++) {

		var preX = currentBlocks[i].x;
		var preY = currentBlocks[i].y;
		//以第三块为旋转中心
		if (i!=2) {
			var afterRotateX = currentBlocks[2].x + preY - currentBlocks[2].y;
			var afterRotateY = currentBlocks[2].y + currentBlocks[2].x - preX;

			if (afterRotateX < 0 || afterRotateX > COLS-1 || afterRotateY < 0 || afterRotateY > ROWS-1 || //不能超过边界
				tetrisStatus[afterRotateY][afterRotateX] != NO_BLOCK //旋转后的位置有固定方块
				) {
				canRotate = false;
				break;
			}

		}
	}

	if (canRotate) {
		//旋转前变白
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			tetrisCtx.fillStyle = colors[NO_BLOCK];
			tetrisCtx.fillRect(cur.x*CELL_WIDTH+1, cur.y*CELL_HEIGHT+1, CELL_WIDTH-2, CELL_HEIGHT-2);
		}

		//全部旋转
		for (let i=0; i<currentBlocks.length; i++) {
			var preX = currentBlocks[i].x;
			var preY = currentBlocks[i].y;
			if (i != 2) {
				currentBlocks[i].x = currentBlocks[2].x + preY - currentBlocks[2].y;
				currentBlocks[i].y = currentBlocks[2].y + currentBlocks[2].x -preX;
			}
		}

		//上色
		for (let i=0; i<currentBlocks.length; i++) {
			var cur = currentBlocks[i];
			tetrisCtx.fillStyle = colors[cur.colors];
			tetrisCtx.fillRect(cur.x*CELL_WIDTH+1, cur.y*CELL_HEIGHT+1, CELL_WIDTH-2, CELL_HEIGHT-2);
		}
	}
}