/*
 * jQuery reSlider
 * ver: 0.1
 * Author: Yoshito Kogawa
 */
(function($){
	"use strict";

	// windoオブジェクトにconsoleオブジェクトが無い場合
	if (!('console' in window)) {
		// windowオブジェクトにconsoleオブジェクトを作成
		window.console = {};

		// 作ったconsoleオブジェクトに更に引数をそのまま返すlogオブジェクトを作成
		window.console.log = function(str){return str;};
	}
	var userAgent = window.navigator.userAgent.toLowerCase();
	var appVersion = window.navigator.appVersion.toLowerCase();

	// オプションが指定されなかったときの設定
	var defaults = {
		current              : 0,
		width                : 900,	// スライダーの幅
		slideShow            : true,	// スライドショーを実行するか
		slideShowDelay       : false,	// スライドショーが始まるまでの待ち時間。falseだとintervalと同じ値になる
		hoverStop            : false,	// スライダーにカーソルが重なったときにスライドショーを停止するか
		interval             : 5000,	// スライドショーの待ち時間
		fadeIn               : false,	// 初回表示のときにフェードインするか
		fadeInDuration       : 1500,	// 初回表示のフェードインにかける時間
		fadeInEasing         : 'swing',   // フェードインアニメーションのイージング
		loop                 : true,	// スライドがループするか
		rouletteLoop         : false,
		orientation          : 'horizontal',    // horizontal か vertical
		reverse:false,	// スライドの方向を逆にする
		slideContainer       : '.reSlider-slide-container',
		slides               : '.reSlider-slides',
		slide                : '.reSlider-slide',
		slideWidth           : 900,	// スライドの幅
		slideHeight          : 400,	// スライドの高さ
		slideDuration        : 500,	// スライドのアニメーションにかける時間
		slideEasing          : 'swing',   // スライドアニメーションのイージング
		slidePrevBtn: '.reSlider-prev',
		slideNextBtn: '.reSlider-next',
		thumbnailContainer   : '.reSlider-thumbnail-container',
		thumbnails           : '.reSlider-thumbnail-list',
		thumbnail            : '.reSlider-thumbnail-box',
		thumbnailMask        : '.reSlider-thumbnail-mask',
		thumbnailPosition    : 'right',	// サムネイルを表示する位置（スライドから見た相対位置）
		thumbnailWidth       : 160,	// サムネイルの幅
		thumbnailHeight      : 57,	// サムネイルの高さ
		thumbnailMaskDuration: 500,	// サムネイルのマスクが消えるまでの時間
		thumbnailMaskEasing  : 'linear'	// サムネイルのマスクが消えるアニメーションのイージング
	};

	// プラグインの名前
	var pluginName = 'reSlider';

	$.fn.reSlider = function(options){
		// 参照要素がなかったら処理を止める
		if(this.length === 0){
			return this;
		}

		// 参照要素が複数だったらループで回す
		if(this.length > 1){
			this.each(function(){$(this).reSlider(options);});
			return this;
		}

		// 使用する変数の宣言
		var slider = {},
			self   = this,
			styles = {},
			timer,
			hover,
			firstSlideshow = true,
			slideContainer,
			slides,
			slide,
			slideMax,
			slidePrevBtn,
			slideNextBtn,
			rouletteLoopDiff = 0,
			reverseDiff = 0,
			thumbnailContainer,
			thumbnails,
			thumbnail,
			thumbnailMask
			;

		var init = function(){
			// デフォルトのオプションと指定されたオプションをマージして代入する
			slider.settings    = $.extend({}, defaults, options);

			// 操作するDOMをキャッシュ
			slideContainer     = self.find(slider.settings.slideContainer);
			slides             = self.find(slider.settings.slides);
			slide              = self.find(slider.settings.slide);
			slidePrevBtn       = self.find(slider.settings.slidePrevBtn);
			slideNextBtn       = self.find(slider.settings.slideNextBtn);
			thumbnailContainer = self.find(slider.settings.thumbnailContainer);
			thumbnail          = self.find(slider.settings.thumbnail);
			thumbnailMask      = self.find(slider.settings.thumbnailMask);

			//　スライドの数を設定
			slideMax = slide.length - 1;

			// ルーレットのようなループをするためにダミーのスライドを作成する
			if(slider.settings.rouletteLoop){
				// ダミーのスライド分位置がずれるためその差を代入しておき位置の計算時に引く
				rouletteLoopDiff = 1;

				// ダミースライドの生成
				slides.append(slide.eq(0).clone());
				slides.prepend(slide.eq(slideMax).clone(true));
				self.addClass('reSlider-rouletteLoop');

				// 再キャッシュ
				slide = self.find(slider.settings.slide);
			}

			// スライドの方向が逆の場合にHTMLの順番を入れ替える
			// TODO: rouletteLoopへの対応
			if(slider.settings.reverse){
				slide.each(function(){
					slides.prepend($(this));
				});

				// スライドの位置を調整するための変数に
				if(slider.settings.orientation == 'horizontal'){
					reverseDiff = -slider.settings.slideWidth * slideMax;
				}else if(slider.settings.orientation == 'vertical'){
					reverseDiff = -slider.settings.slideHeight * slideMax;
				}

				//　再キャッシュ
				slide = self.find(slider.settings.slide);
			}

			// スライドの方向に対応したクラスを付与
			if(slider.settings.orientation == 'horizontal'){
				self.addClass('reSlider-horizontal');
			}else if(slider.settings.orientation == 'vertical'){
				self.addClass('reSlider-vertical');
			}

			// サムネイルがあれば
			if(thumbnailContainer.length){
				// サムネイルの位置に対応したクラスを付与
				if(slider.settings.thumbnailPosition == 'bottom'){
					self.addClass('reSlider-thumbnail-bottom');
				}else if(slider.settings.thumbnailPosition == 'right'){
					self.addClass('reSlider-thumbnail-right');
				}
			}

			// カレント位置のスライドに対応したクラスを付与
			slide.eq(slider.settings.current).addClass('reSlider-slide-current');

			// サイズの設定
			self.sizeSet();

			// 初期位置の設定
			self.posSet(slider.settings.current);

			// フェードイン
			if(slider.settings.fadeIn){
				self.stop().fadeTo(slider.settings.fadeInDuration, 1, slider.settings.fadeInEasing);
			}

			// スライドショー実行
			if(slider.settings.slideShow){
				self.slideShow();

				self.hover(function(){
					// ホバーしたらスライドショー停止
					if(slider.settings.hoverStop){
						hover = 1;
						self.slideShowStop();
					}

				}, function(){
					// ホバーが解除されたらスライドショー再開
					if(slider.settings.hoverStop){
						hover = 0;
						self.slideShow();
					}
				});
			}

			// スライドボタン
			slidePrevBtn.on('click.'+pluginName, function(){
				slider.settings.current--;
				self.move();
			});

			slideNextBtn.on('click.'+pluginName, function(){
				slider.settings.current++;
				self.move();
			});

			// コントロールボタンのステータス更新
			self.btnStatusUpdate();

			// サムネイル
			if(thumbnail.length){
				thumbnail.eq(slider.settings.current).addClass('reSlider-thumbnail-current');
				thumbnail.click(function(){
					slider.settings.current = thumbnail.index(this);
					self.move();
				});

				if(thumbnailMask.length){
					thumbnailMask.eq(slider.settings.current).hide();
				}
			}
		};

		self.btnStatusUpdate = function(){
			// ループする場合は更新する必要がないため処理を止める
			if(slider.settings.loop) return false;

			if(slider.settings.current <= 0){
				slidePrevBtn.addClass('disabled');
				slideNextBtn.removeClass('disabled');

			}else if(slider.settings.current >= slideMax){
				slidePrevBtn.removeClass('disabled');
				slideNextBtn.addClass('disabled');

			}else {
				slidePrevBtn.removeClass('disabled');
				slideNextBtn.removeClass('disabled');

			}
		}

		self.moveStyles = function(goto){
			// スライドの方向にあわせてスタイルの設定
			if(slider.settings.orientation == 'horizontal'){
				styles = {
					left: -slider.settings.slideWidth * (goto + rouletteLoopDiff)
				}

				if(slider.settings.reverse){
					styles.left = reverseDiff - styles.left;
				}
			}else if(slider.settings.orientation == 'vertical'){
				styles = {
					top: -slider.settings.slideHeight * (goto + rouletteLoopDiff)
				}

				if(slider.settings.reverse){
					styles.top = reverseDiff - styles.top;
				}
			}
		}

		self.move = function(goto){
			self.slideShowStop();
			if(goto !== undefined){
				slider.settings.current = goto;
			}

			// ルーレットループをする場合
			if(slider.settings.rouletteLoop){
				// カレントがスライドの枚数を超えたとき
				if(slider.settings.current < -rouletteLoopDiff){
					slider.settings.current = slideMax;
					self.posSet();
					slider.settings.current = slideMax - rouletteLoopDiff;
				}else if(slider.settings.current > slideMax + rouletteLoopDiff){
					slider.settings.current = 0;
					self.posSet();
					slider.settings.current = rouletteLoopDiff;
				}

			// ルーレットループをしない場合
			}else{
				// カレントがスライドの枚数を超えたとき
				if(slider.settings.current > slideMax){
					// ループをしない場合は処理を止める
					if(!slider.settings.loop){
						slider.settings.current = slideMax;
						return false;
					}
					slider.settings.current = 0;

				}else if(slider.settings.current < 0){
					// ループをしない場合は処理を止める
					if(!slider.settings.loop){
						slider.settings.current = 0;
						return false;
					}
					slider.settings.current = slideMax;

				}

			}


            $("body").removeClass().addClass("paso_fondo"+slider.settings.current);

			// カレントクラス付与
			slide.removeClass('reSlider-slide-current');
			slide.eq(slider.settings.current).addClass('reSlider-slide-current');
			thumbnail.removeClass('reSlider-thumbnail-current');
			thumbnail.eq(slider.settings.current).addClass('reSlider-thumbnail-current');

			// サムネイルのマスク操作
			if(thumbnailMask.length && appVersion.indexOf("msie 8.") < 0){
				thumbnailMask.stop()
					.fadeTo(slider.settings.thumbnailMaskDuration,
							1,
							slider.settings.thumbnailMaskEasing);

				thumbnailMask.eq(slider.settings.current).stop()
					.fadeTo(slider.settings.thumbnailMaskDuration,
							0,
							slider.settings.thumbnailMaskEasing);
			}else{
				thumbnailMask.stop().show();
				thumbnailMask.eq(slider.settings.current).hide();
			}

			// スライドの方向にあわせてスタイルの設定
			self.moveStyles(slider.settings.current);

			// コントロールボタンのステータス更新
			self.btnStatusUpdate();

			// スライドアニメーション実行
			slides.stop().animate(
				styles,
				slider.settings.slideDuration,
				slider.settings.slideEasing,
				function(){
					//　最初のスライドの位置に移動させる
					// if(slider.settings.rouletteLoop){
					// 	if(slider.settings.current > slideMax){
					// 		slider.settings.current = 0;
					// 	}else if(slider.settings.current < 0){
					// 		slider.settings.current = slideMax;
					// 	}
					// 	self.posSet(slider.settings.current);
					// }

					// スライドショーが有効かつカーソルがサムネイルに載っていないときに実行
					if(slider.settings.slideShow && !hover){
						self.slideShow();
					}
				});
		};

		self.slideShow = function(interval){
			if(!interval){
				interval = slider.settings.interval;
			}

			// 最初のスライドショーまでの時間を
			if(firstSlideshow && slider.settings.slideShowDelay !== false){
				interval = slider.settings.slideShowDelay;
			}

			timer = setTimeout(function(){
				firstSlideshow = false;
				slider.settings.current++;
				self.move();
			}, interval);
		};

		self.slideShowStop = function(){
			clearTimeout(timer);
		};

		self.sizeSet = function(){
			self.css({
				width: slider.settings.width
			});

			if(slider.settings.orientation == 'horizontal'){
				slides.css({
					width: slider.settings.slideWidth * slide.length
				});
			}

			slideContainer.css({
				width: slider.settings.slideWidth,
				height: slider.settings.slideHeight
			});

			slide.css({
				width: slider.settings.slideWidth,
				height: slider.settings.slideHeight
			});

			thumbnail.css({
				width: slider.settings.thumbnailWidth,
				height: slider.settings.thumbnailHeight
			});
		};

		self.posSet = function(goto){
			if(goto !== undefined){
				slider.settings.current = goto;
			}

			// スライドの方向にあわせてスタイルの設定
			self.moveStyles(slider.settings.current);

			// スタイルのセット
			slides.stop().css(styles);
		};

		init();

		return(this);
	};
})(jQuery);
