//v.3.6 build 130619

/*
Copyright DHTMLX LTD. http://www.dhtmlx.com
You allowed to use this component or parts of it under GPL terms
To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com
*/
dhtmlXAccordion.prototype.enableDND = function() {
	
	for (var q=0; q<this.base.childNodes.length; q++) {
		this.base.childNodes[q].firstChild._click = this.base.childNodes[q].firstChild.onclick;
		this.base.childNodes[q].firstChild.onclick = function() {
			if (!dnd.dragMOffset) this._click();
		}
	}
	
	var t = this;
	var dnd = dhtmlXAccordionDND(this.base);
	
	dnd.doOnDragStop = function(){
		t.setSizes();
		t.callEvent("onDrop",arguments);
	}
	
}

function dhtmlXAccordionDND(obj) {
	
	var that = this;
	
	for (var q=0; q<obj.childNodes.length; q++) {
		obj.childNodes[q].onmousedown = function(e){
			e = e||event;
			var t = (e.target||e.srcElement);
			if (t == this.firstChild || t == this.firstChild.firstChild) that.dragStart(e||event, this);
		}
	}
	
	this.dragStart = function(e,t) {
		
		this.dragObj = t;
		
		this.dragObj.className += " dragged";
		this.dy = e.clientY;
		
		this.h = this.dragObj.offsetHeight;
		
		// define index and min/max offset for dragged object
		var u = 0;
		
		for (var q=0; q<this.dragObj.parentNode.childNodes.length; q++) {
			this.dragObj.parentNode.childNodes[q]._ind = q; // recalculate indecies
			if (this.dragObj.parentNode.childNodes[q] == this.dragObj) {
				this.dragObj._k0 = u;
				u = 0;
			} else {
				u += this.dragObj.parentNode.childNodes[q].offsetHeight;
			}
		}
		this.dragObj._k1 = u+2;
		
		this.dragMOffset = false; // check if mouse was realy moved over screen
	}
	
	this.doDrag = function(e) {
		
		if (!this.dragObj) return;
		
		var r = e.clientY-this.dy;
		
		if (Math.abs(r) > 5) this.dragMOffset = true;
		
		// overlaying left/right
		if (r < 0) {
			if (r < -this.dragObj._k0) r = -this.dragObj._k0;
		} else {
			if (r > this.dragObj._k1) r = this.dragObj._k1;
		}
		
		this.dragObj.style.top = r+"px";
		
		// prev
		
		// get offset
		var ofs = e.clientY-this.dy;
		var s0 = 0;
		var i = 0;
		for (var q=this.dragObj._ind+1; q<=this.dragObj.parentNode.lastChild._ind; q++) {
			var w0 = this.dragObj.parentNode.childNodes[q].offsetHeight;
			if (ofs > s0+w0*2/3) i++;
			s0 += w0;
		}
		
		// loop through siblings
		var s = this.dragObj.nextSibling;
		var q = 0;
		
		while (s != null) {
			
			if (++q<=i && s != null) {
				// move to left if not moved yet
				if (!s._ontop) {
					if (s._tm) window.clearTimeout(s._tm);
					this.animate(s, false, parseInt(s.style.top||0), -this.h);
					s._ontop = true;
				}
			} else {
				// move to right (to orig position) if moved to left
				if (s._ontop) {
					if (s._tm) window.clearTimeout(s._tm);
					this.animate(s, true, parseInt(s.style.top||0), 0);
					s._ontop = false;
				}
			}
			
			s = s.nextSibling;
		}
		
		// next
		
		// get offset
		var ofs = this.dy-e.clientY;
		var s0 = 0;
		var i = 0;
		for (var q=this.dragObj._ind-1; q>=this.dragObj.parentNode.firstChild._ind; q--) {
			var w0 = this.dragObj.parentNode.childNodes[q].offsetHeight;
			if (ofs > s0+w0*2/3) i++;
			s0 += w0;
		}
		
		// loop through siblings
		var s = this.dragObj.previousSibling;
		var q = 0;
		
		while (s != null) {
			
			if (++q<=i && s != null) {
				if (!s._onbottom) {
					if (s._tm) window.clearTimeout(s._tm);
					this.animate(s, true, parseInt(s.style.top||0), this.h);
					s._onbottom = true;
				}
			} else {
				if (s._onbottom) {
					if (s._tm) window.clearTimeout(s._tm);
					this.animate(s, false, parseInt(s.style.top), 0);
					s._onbottom = false;
				}
			}
			
			s = s.previousSibling;
		}
			
	}
	
	this.dragStop = function(e) {
		
		if (!this.dragObj) return;
		
		this.dragObj.className = String(this.dragObj.className).replace(/dragged/gi,"");
		this.dragObj.style.top = "0px";
		
		var p = false;
		
		for (var q=0; q<this.dragObj.parentNode.childNodes.length; q++) {
			var s = this.dragObj.parentNode.childNodes[q];
			
			if (s != this.dragObj) {
				if (s._tm) window.clearTimeout(s._tm);
				s.style.top = "0px";
				if (s._ontop && ((s.nextSibling != null && s.nextSibling._ontop != true) || !s.nextSibling)) {
					p = (s.nextSibling||null);
				}
				if (s._onbottom && ((s.previousSibling != null && s.previousSibling._onbottom != true) || !s.previousSibling)) {
					p = s;
				}
			}
			s = null;
		}
		for (var q=0; q<this.dragObj.parentNode.childNodes.length; q++) {
			this.dragObj.parentNode.childNodes[q]._ontop = null;
			this.dragObj.parentNode.childNodes[q]._onbottom = null;
			
		}
		
		if (p !== false) {
			if (p == null) {
				this.dragObj.parentNode.appendChild(this.dragObj);
			} else {
				this.dragObj.parentNode.insertBefore(this.dragObj, p);
			}
		}
		
		if (typeof(this.doOnDragStop) != "undefined") {
			var id = this.dragObj._id;
			var ind0 = this.dragObj._ind;
			var ind1 = ind0;
			for (var q=0; q<this.dragObj.parentNode.childNodes.length; q++) {
				if (this.dragObj.parentNode.childNodes[q] == this.dragObj) ind1 = q;
			}
		}
		
		this.dragObj = null;
		
		if (typeof(this.doOnDragStop) != "undefined" && ind0 != ind1) this.doOnDragStop(id, ind0, ind1);
	}
	
	this.animate = function(obj, dir, f, t) {
		var stop = false;
		if (dir) {
			f += 5;
			if (f >= t) { f = t; stop = true; }
		} else {
			f -= 5;
			if (f <= t) { f = t; stop = true; }
		}
		obj.style.top = f+"px";
		if (obj._tm) window.clearTimeout(obj._tm);
		if (!stop) {
			obj._tm = window.setTimeout(function(){that.animate(obj, dir, f, t);},5);
		} else {
			obj._tm = null;
		}
		
	}
	
	this.doOnMouseMove = function(e) {
		that.doDrag(e||event);
	}
	
	this.doOnMouseUp = function(e) {
		that.dragStop(e||event);
	}
	
	
	if (window.addEventListener) {
		document.body.addEventListener("mousemove", this.doOnMouseMove, false);
		document.body.addEventListener("mouseup", this.doOnMouseUp, false);
	} else {
		document.body.attachEvent("onmousemove", this.doOnMouseMove, false);
		document.body.attachEvent("onmouseup", this.doOnMouseUp, false);
	}
	
	return this;
}


