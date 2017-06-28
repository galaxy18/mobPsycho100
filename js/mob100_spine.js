function CRChara(options, canvas, callback) {
	this.options = options;
	this.lastFrameTime = Date.now() / 1000;
	this.mvp = new spine.webgl.Matrix4();
	this.skeletons = {};
	this.activeSkeleton = "";
	this.animations = new Object();
	this.animations.idle = new Array("0_0");
	this.animations.click = new Array("100_0","200_0","600_0");
	this.callback = callback;
	this.stop = false;
	
	this.init = function() {
		if (this.options.id == undefined) return;
		this.activeSkeleton = this.options.id;
		
		// Setup this.canvas[0] and WebGL context. We pass alpha: false to this.canvas[0].getContext() so we don't use premultiplied alpha when
		// loading textures. That is handled separately by PolygonBatcher.
		this.canvas = canvas;
		//this.canvas[0].width = window.innerWidth;
		//this.canvas[0].height = window.innerHeight;
		var config = { alpha: true };
		this.gl = this.canvas[0].getContext("webgl", config) || this.canvas[0].getContext("experimental-webgl", config);
		
		// Create a simple this.shader, mesh, model-view-projection matrix and this.skeletonRenderer.
		this.shader = spine.webgl.Shader.newColoredTextured(this.gl);
		this.batcher = new spine.webgl.PolygonBatcher(this.gl);
		this.mvp.ortho2d(0, 0, this.canvas[0].width - 1, this.canvas[0].height - 1);
		this.skeletonRenderer = new spine.webgl.SkeletonRenderer(this.gl);
		this.debugRenderer = new spine.webgl.SkeletonDebugRenderer(this.gl);
		this.debugRenderer.drawRegionAttachments = false;
		this.debugRenderer.drawBoundingBoxes = false;
		this.debugRenderer.drawMeshHull = false;
		this.debugRenderer.drawMeshTriangles = false;
		this.debugRenderer.drawPaths = false;
		this.debugShader = spine.webgl.Shader.newColored(this.gl);
		this.shapes = new spine.webgl.ShapeRenderer(this.gl);
		this.assetManager = new spine.webgl.AssetManager(this.gl);
	
		// Tell this.assetManager to load the resources for each model, including the exported .json file, the .atlas file and the .png
		// file for the atlas. We then wait until all resources are loaded in the load() method.
		//this.assetManager.loadText("assets/"+this.options.weapon+".json");
		this.assetManager.loadText("assets/fr_"+this.options.id+".atlas.txt");
		this.assetManager.loadTexture("assets/fr_"+this.options.id+".png");
		this.assetManager.loadText("assets/fr_"+this.options.id+".txt");
		
		window.requestAnimationFrame(this.load.bind(this));

		//TODO: background
//		this.canvas.css('background-image', "url('assets/icon/web_"+this.options.id+"1.png'), url('assets/large/"+this.options.id+".png')");
		return this;
	}
	
	this.load = function () {
		// Wait until the this.assetManager has loaded all resources, then load the this.skeletons.
		if (this.assetManager.isLoadingComplete()) {
			this.skeletons[this.options.id] = this.loadSkeleton(this.options.id, "", true);
			this.setupUI();
			window.requestAnimationFrame(this.render.bind(this));
			this.callback();
		} else {
			window.requestAnimationFrame(this.load.bind(this));
		}
	}
	
	this.getRandomAnimation = function(type){
		if (type == 'click'){
			return (this.animations.click[Math.floor(Math.random()*this.animations.click.length)]);
		}else{
			return (this.animations.idle[Math.floor(Math.random()*this.animations.idle.length)]);
		}
	}
	
	this.loadSkeleton = function(name, initialAnimation, premultipliedAlpha, skin) {
		var CRObj = this;
		
		if (skin === undefined) skin = "default";
	
		// Load the texture atlas using name.atlas and name.png from the this.assetManager.
		// The function passed to TextureAtlas is used to resolve relative paths.
		atlas = new spine.TextureAtlas(this.assetManager.get("assets/fr_" + name + ".atlas.txt"), function(path) {
			return CRObj.assetManager.get("assets/" + path);		
		});
	
		// Create a TextureAtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
		atlasLoader = new spine.TextureAtlasAttachmentLoader(atlas);
	
		// Create a SkeletonJson instance for parsing the .json file.
		var skeletonJson = new spine.SkeletonJson(atlasLoader);
		
		// Set the scale to apply during parsing, parse the file, and create a new skeleton.	
		var skeletonData = skeletonJson.readSkeletonData(this.assetManager.get("assets/fr_" + this.options.id + ".txt"));
		var skeleton = new spine.Skeleton(skeletonData);
		skeleton.setSkinByName(skin);
		var bounds = this.calculateBounds(skeleton);	
	
		// Create an AnimationState, and set the initial animation in looping mode.
		var animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
		initialAnimation = this.getRandomAnimation();
		animationState.setAnimation(0, initialAnimation, true);
		animationState.addListener({
			event: function(trackIndex, event) {
				// console.log("Event on track " + trackIndex + ": " + JSON.stringify(event));
			},
			complete: function(trackIndex, loopCount) {
				// console.log("Animation on track " + trackIndex + " completed, loop count: " + loopCount);
				//TODO
				var state = CRObj.skeletons[CRObj.activeSkeleton].state;
				var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
				var animationName = CRObj.getRandomAnimation();
				//skeleton.setToSetupPose();
				state.setAnimation(0, animationName, true);
			},
			start: function(trackIndex) {
				// console.log("Animation on track " + trackIndex + " started");
			},
			end: function(trackIndex) {
				// console.log("Animation on track " + trackIndex + " ended");
			}
		})
	
		// Pack everything up and return to caller.
		return { skeleton: skeleton, state: animationState, bounds: bounds, premultipliedAlpha: premultipliedAlpha };
	}
	
	this.calculateBounds = function(skeleton) {	
		skeleton.setToSetupPose();
		skeleton.updateWorldTransform();
		var offset = new spine.Vector2();
		var size = new spine.Vector2();
		skeleton.getBounds(offset, size);
		return { offset: offset, size: size };
	}
	
	this.setupUI = function () {
		var CRObj = this;
		canvas.click(function(){			
			var state = CRObj.skeletons[CRObj.activeSkeleton].state;
			var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
			var animationName = CRObj.getRandomAnimation('click');
			skeleton.setToSetupPose();
			state.setAnimation(0, animationName, CRObj.options.weapon != "gulid");
		})
		/*var skeletonList = $("#skeletonList");
		skeletonList.empty();
		for (var skeletonName in this.skeletons) {
			var option = $("<option></option>");
			option.attr("value", skeletonName).text(skeletonName);
			if (skeletonName === this.activeSkeleton) option.attr("selected", "selected");
			skeletonList.append(option);
		}*/
		var setupAnimationUI = function() {
			var animationList = $("#animationList");
			if (animationList == undefined){return;}
			
			animationList.empty();
			var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
			var state = CRObj.skeletons[CRObj.activeSkeleton].state;
			var activeAnimation = state.tracks[0].animation.name;
			for (var i = 0; i < skeleton.data.animations.length; i++) {
				var name = skeleton.data.animations[i].name;
				var option = $("<option></option>");
				option.attr("value", name).text(name);
				if (name === activeAnimation) option.attr("selected", "selected");
				animationList.append(option);
			}
	
			animationList.change(function() {
				var state = CRObj.skeletons[CRObj.activeSkeleton].state;
				var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
				var animationName = $("#animationList option:selected").text();
				skeleton.setToSetupPose();
				state.setAnimation(0, animationName, true);			
			})
		}
	
		/*var setupSkinUI = function() {
			var skinList = $("#skinList");
			skinList.empty();
			var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
			var activeSkin = skeleton.skin == null ? "default" : skeleton.skin.name;
			for (var i = 0; i < skeleton.data.skins.length; i++) {
				var name = skeleton.data.skins[i].name;
				var option = $("<option></option>");
				option.attr("value", name).text(name);
				if (name === activeSkin) option.attr("selected", "selected");
				skinList.append(option);
			}
	
			skinList.change(function() {			
				var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
				var skinName = $("#skinList option:selected").text();
				skeleton.setSkinByName(skinName);
				skeleton.setSlotsToSetupPose();
			})
		}*/
	
		/*skeletonList.change(function() {
			CRObj.activeSkeleton = $("#skeletonList option:selected").text();
			setupAnimationUI();
			setupSkinUI();
		})*/
		setupAnimationUI();
//		setupSkinUI();
	}
	
	this.render = function() {
		if (this.canvas.css("display")==="none"){return;}
		
		var now = Date.now() / 1000;
		var delta = now - this.lastFrameTime;
		this.lastFrameTime = now;
	
		// Update the this.mvp matrix to adjust for this.canvas[0] size changes
		this.resize();
	
		this.gl.clearColor(0, 0, 0, 0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	
		// Apply the animation state based on the delta time.
		var state = this.skeletons[this.activeSkeleton].state;
		var skeleton = this.skeletons[this.activeSkeleton].skeleton;
		var premultipliedAlpha = this.skeletons[this.activeSkeleton].premultipliedAlpha;
		state.update(delta);
		state.apply(skeleton);
		skeleton.updateWorldTransform();
	
		// Bind the this.shader and set the texture and model-view-projection matrix.
		this.shader.bind();
		this.shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
		this.shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);
	
		// Start the batch and tell the this.skeletonRenderer to render the active skeleton.
		this.batcher.begin(this.shader);
		this.skeletonRenderer.premultipliedAlpha = premultipliedAlpha;
		this.skeletonRenderer.preserveDrawingBuffer = false;
		this.skeletonRenderer.draw(this.batcher, skeleton);
		this.batcher.end();
			
		this.shader.unbind();
	
		// draw debug information
		/*
		debugShader.bind();
		debugShader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);
		this.debugRenderer.premultipliedAlpha = premultipliedAlpha;
		this.shapes.begin(debugShader);
		this.debugRenderer.draw(this.shapes, skeleton);
		this.shapes.end();
		debugShader.unbind();
		*/
		if (captureFrame1 && this.canvas[0].id == 'canvas1') {
			captureFrame1 = false;
			var data = this.canvas[0].toDataURL();
			$("#captureresult").append("<a href='"+data+"' target='_blank' download='"+this.options.id+".png'>"+this.canvas[0].id+"</a>");
		}
		if (captureFrame2 && this.canvas[0].id == 'canvas2') {
			captureFrame2 = false;
			var data = this.canvas[0].toDataURL();
			$("#captureresult").append("<a href='"+data+"' target='_blank' download='"+this.options.id+".png'>"+this.canvas[0].id+"</a>");
		}
		
		if (!this.stop)
			window.requestAnimationFrame(this.render.bind(this));
	}
	
	this.resize = function () {
		var w = this.canvas[0].clientWidth;
		var h = this.canvas[0].clientHeight;
		
		var bounds = this.skeletons[this.activeSkeleton].bounds;
		if (this.canvas[0].width != w || this.canvas[0].height != h) {
			this.canvas[0].width = w;
			this.canvas[0].height = h;
		}
	
		// magic
		var centerX = bounds.offset.x + bounds.size.x / 2;
		var centerY = bounds.offset.y + bounds.size.y / 2;
		var scaleX = bounds.size.x / this.canvas[0].width;
		var scaleY = bounds.size.y / this.canvas[0].height;
		var scale = Math.max(scaleX, scaleY) * 1.2;
		if (scale < 1) scale = 1;
		var width = this.canvas[0].width * scale;
		var height = this.canvas[0].height * scale;
	
		this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
		this.gl.viewport(0, 0, this.canvas[0].width, this.canvas[0].height);
	
	/*	var width = this.canvas[0].width;
		var height = this.canvas[0].height;
		
		var x =  - width / 2 - bounds.size.x / 2;
		var y = bounds.offset.y;
		
		this.mvp.ortho2d(x, y, width*2, height*2);
		
		this.gl.viewport(0, 0, this.canvas[0].width, this.canvas[0].height);
	*/
	}
};