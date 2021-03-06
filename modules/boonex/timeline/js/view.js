/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

function BxTimelineView(oOptions) {
	this._sActionsUri = oOptions.sActionUri;
    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oTimelineView' : oOptions.sObjName;
    this._iOwnerId = oOptions.iOwnerId == undefined ? 0 : oOptions.iOwnerId;
    this._sReferrer = oOptions.sReferrer == undefined ? '' : oOptions.sReferrer;
    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'slide' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
    this._oRequestParams = {
    	timeline: null,
    	outline: null,
    	general: oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams
    };

    this._fOutsideOffset = 0.8;
    this._oSaved = {};

    var $this = this;
    $(document).ready(function() {
    	$this.init();
    });
}

BxTimelineView.prototype = new BxTimelineMain();

BxTimelineView.prototype.init = function() {
	var $this = this;

	this.oViewTimeline = $('#' + this._aHtmlIds['main_timeline']);
	this.bViewTimeline = this.oViewTimeline.length > 0;

	this.oViewOutline = $('#' + this._aHtmlIds['main_outline']);
	this.bViewOutline = this.oViewOutline.length > 0;	

	if(this.bViewTimeline) {
		this._oRequestParams['timeline'] = jQuery.extend({}, this._oRequestParams['general']);

		var oItems = this.oViewTimeline.find('.' + this.sClassItem);
		oItems.find('.bx-tl-item-text .bx-tl-content').checkOverflowHeight(this.sSP + '-overflow', function(oElement) {
			$this.onFindOverflow(oElement);
		});

		//--- Hide timeline Events which are outside the viewport
		this.hideEvents(oItems, this._fOutsideOffset);

		//on scolling, show/animate timeline Events when enter the viewport
		$(window).on('scroll', function() {
			if(!window.requestAnimationFrame) 
				setTimeout(function() {
					$this.showEvents(oItems, $this._fOutsideOffset);
				}, 100);
			else
				window.requestAnimationFrame(function() {
					$this.showEvents(oItems, $this._fOutsideOffset);
				});
		});
	}

	if(this.bViewOutline) {
		this._oRequestParams['outline'] = jQuery.extend({}, this._oRequestParams['general']);

    	this.initMasonry();

    	this.oViewOutline.find('.' + this.sClassItem).resize(function() {
    		$this.reloadMasonry();
    	});
    	this.oViewOutline.find('img.' + this.sClassItemImage).load(function() {
    		$this.reloadMasonry();
    	});
	}

	this.initFlickity();
};

BxTimelineView.prototype.hideEvents = function(oEvents, fOffset) {
	oEvents.each(function() {
		( $(this).offset().top > $(window).scrollTop() + $(window).height() * fOffset ) && $(this).find('.bx-tl-item-type, .bx-tl-item-cnt').addClass('is-hidden');
	});
};

BxTimelineView.prototype.showEvents = function(oEvents, fOffset) {
	oEvents.each(function() {
		( $(this).offset().top <= $(window).scrollTop() + $(window).height() * fOffset && $(this).find('.bx-tl-item-type').hasClass('is-hidden') ) && $(this).find('.bx-tl-item-type, .bx-tl-item-cnt').removeClass('is-hidden').addClass('bounce-in');
	});
};

BxTimelineView.prototype.changePage = function(oLink, iStart, iPerPage) {
	var $this = this;
	var sView = this._getView(oLink);

	this.loadingInButton(oLink, true);

	this._oRequestParams[sView].start = iStart;
    this._oRequestParams[sView].per_page = iPerPage;
    this._getPosts(oLink, function(oData) {
    	$this.loadingInButton(oLink, false);

    	var oView = null;
    	var sItems = $.trim(oData.items);
    	switch(sView) {
    		case 'timeline':
    			oView = $this.oViewTimeline;
    			oView.find('.' + $this.sClassItems).append($(sItems).hide()).find('.' + $this.sClassItem + ':hidden').bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed, function() {
					$(this).bxTime();

					$this.initFlickity();
			    });
    			break;

    		case 'outline':
    			oView = $this.oViewOutline;
    			$this.appendMasonry($(sItems).bxTime(), function() {
    				$this.initFlickity();
    			});
    			break;
    	}

    	if(oView && oData && oData.load_more != undefined)
    		oView.find('.' + $this.sSP + '-load-more-holder').html($.trim(oData.load_more));

    	if(oView && oData && oData.back != undefined)
    		oView.find('.' + $this.sSP + '-back-holder').html($.trim(oData.back));

    	if(oData && oData.empty != undefined)
			oView.find('.' + $this.sSP + '-empty-holder').html($.trim(oData.empty));
    });
};

BxTimelineView.prototype.changeFilter = function(oLink) {
	var sView = this._getView(oLink);

    var sId = $(oLink).attr('id');
    sId = sId.substr(sId.lastIndexOf('-') + 1, sId.length);

    this.loadingInBlock(oLink, true);

    this._oRequestParams[sView].start = 0;
    this._oRequestParams[sView].filter = sId;
    this._getPosts(oLink);
};

BxTimelineView.prototype.changeTimeline = function(oLink, iYear) {
	var sView = this._getView(oLink);

	this.loadingInBlock(oLink, true);

	this._oRequestParams[sView].start = 0;
    this._oRequestParams[sView].timeline = iYear;
	this._getPosts(oLink);
};

BxTimelineView.prototype.showMore = function(oLink) {
	var sView = this._getView(oLink);
	var sClassOverflow = this.sSP + '-overflow';

	$(oLink).parents('.' + this.sClassItem + ':first').find('.' + sClassOverflow).css('max-height', 'none').removeClass(sClassOverflow);
	$(oLink).parents('.' + this.sSP + '-content-show-more:first').remove();

	switch(sView) {
		case 'timeline':
			break;
	
		case 'outline':
			this.reloadMasonry();
			break;
	}	
};

BxTimelineView.prototype.showItem = function(oLink, iId, sMode, oParams) {
	var sView = this._getView(oLink);
	var oData = $.extend({}, this._getDefaultData(), {id: iId, mode: sMode}, (oParams != undefined ? oParams : {}));

	$(".bx-popup-full-screen.bx-popup-applied:visible").dolPopupHide();

	$(window).dolPopupAjax({
		id: {value: this._aHtmlIds['item_popup_' + sView] + iId, force: true},
		url: bx_append_url_params(this._sActionsUrl + 'get_item_brief', oData),
		removeOnClose: true,
		fullScreen: true
	});

	return false;
};

BxTimelineView.prototype.commentItem = function(oLink, sSystem, iId) {
	var $this = this;
    var oData = this._getDefaultData(oLink);
    oData['system'] = sSystem;
    oData['id'] = iId;

    var oComments = $(oLink).parents('.' + this.sClassItem + ':first').find('.' + this.sClassItemComments);
    if(oComments.children().length > 0) {
    	oComments.bx_anim('toggle', this._sAnimationEffect, this._iAnimationSpeed);
    	return;
    }

    if(oLink)
    	this.loadingInItem(oLink, true);

    jQuery.get (
        this._sActionsUrl + 'get_comments',
        oData,
        function(oData) {
        	if(oLink)
        		$this.loadingInItem(oLink, false);

        	if(!oData.content)
        		return;

        	oComments.html($(oData.content).hide()).children(':hidden').bxTime().bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed);
        },
        'json'
    );
};

BxTimelineView.prototype.pinPost = function(oLink, iId, iWay) {
	var $this = this;
    var oData = this._getDefaultData();
    oData['id'] = iId;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide({
		onHide: function(oPopup) {
			$(oPopup).remove();
		}
	});

    if(this.bViewTimeline)
    	this.loadingInItem($(this.sIdItemTimeline + iId), true);

    if(this.bViewOutline)
    	this.loadingInItem($(this.sIdItemOutline + iId), true);

    $.post(
        this._sActionsUrl + 'pin/',
        oData,
        function(oData) {
        	processJsonData(oData);
        },
        'json'
    );
};

BxTimelineView.prototype.onPinPost = function(oData) {
	var $this = this;

	//--- Pin on Timeline (if available)
	if(this.bViewTimeline) {
		var sItemTimeline = this.sIdItemTimeline + oData.id;

		this._oRequestParams['timeline'].start = 0;
        this._getPosts(this.oViewTimeline, function(oData) {
        	$(sItemTimeline).bx_anim('hide', $this._sAnimationEffect, $this._iAnimationSpeed, function() {
    	        $(this).remove();

    	        processJsonData(oData);
        	});
        });
	}

	//--- Pin on Outline (if available)
	if(this.bViewOutline) {
		var sItemOutline = this.sIdItemOutline + oData.id;

		this._oRequestParams['outline'].start = 0;
        this._getPosts(this.oViewOutline, function(oData) {
        	$this.removeMasonry(sItemOutline, function() {
        		processJsonData(oData);
    		});
        });
	}
};

BxTimelineView.prototype.promotePost = function(oLink, iId, iWay) {
	var $this = this;
    var oData = this._getDefaultData();
    oData['id'] = iId;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide({
		onHide: function(oPopup) {
			$(oPopup).remove();
		}
	});

    var oLoadingContainer = null;
    if(this.bViewTimeline)
    	oLoadingContainer = $(this.sIdItemTimeline + iId);
    if(this.bViewOutline)
    	oLoadingContainer = $(this.sIdItemOutline + iId);

    this.loadingInItem(oLoadingContainer, true);

    $.post(
        this._sActionsUrl + 'promote/',
        oData,
        function(oData) {
        	$this.loadingInItem(oLoadingContainer, false);

        	processJsonData(oData);
        },
        'json'
    );
};

BxTimelineView.prototype.initFormEdit = function(sFormId)
{
	var $this = this;
	var oForm = $('#' + sFormId);

	autosize(oForm.find('textarea'));
	oForm.ajaxForm({
        dataType: "json",
        beforeSubmit: function (formData, jqForm, options) {
        	window[$this._sObjName].beforeFormEditSubmit(oForm);
        },
        success: function (oData) {
        	window[$this._sObjName].afterFormEditSubmit(oForm, oData);
        }
    });
};

BxTimelineView.prototype.beforeFormEditSubmit = function(oForm)
{
	this.loadingInButton($(oForm).children().find(':submit'), true);
};

BxTimelineView.prototype.afterFormEditSubmit = function (oForm, oData)
{
	var $this = this;
	var fContinue = function() {
		if(oData && oData.id != undefined) {
			var iId = parseInt(oData.id);
	        if(iId <= 0) 
	        	return;

	        if($('#' + $this._aHtmlIds['main_timeline']).length)
	        	$this._getPost(oForm, iId, 'timeline');

	        if($('#' + $this._aHtmlIds['main_outline']).length)
	        	$this._getPost(oForm, iId, 'outline');

	        return;
		}

		if(oData && oData.form != undefined && oData.form_id != undefined) {
			$('#' + oData.form_id).replaceWith(oData.form);
			$this.initFormEdit(oData.form_id);

			return;
		}
	};

	this.loadingInButton($(oForm).children().find(':submit'), false);

	if(oData && oData.message != undefined)
        bx_alert(oData.message, fContinue);
	else
		fContinue();
};

BxTimelineView.prototype.editPost = function(oLink, iId) {
	var $this = this;
    var oData = this._getDefaultData();
    oData['id'] = iId;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide();

    var oItem = null;
    if(this.bViewTimeline)
    	oItem = $(this.sIdItemTimeline + iId);

    if(this.bViewOutline)
    	oItem = $(this.sIdItemOutline + iId);

    var oContent = oItem.find('.' + this.sClassItemContent);
    if(oContent.find('form').length) {
        $(oContent).bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
            $(this).html($this._oSaved[iId]).bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed);
        });
        return;
    }
    else
        this._oSaved[iId] = oContent.html();

    this.loadingInItem(oItem, true);

    jQuery.post (
		this._sActionsUrl + 'get_edit_form/' + iId + '/',
		oData,
        function (oData) {
			processJsonData(oData);
        },
        'json'
    );
};

BxTimelineView.prototype.onEditPost = function(oData) {
	var $this = this;

	if(!oData || !oData.id)
		return;

	var oItem = null;
	if(this.bViewTimeline)
		oItem = $(this.sIdItemTimeline + oData.id);
    if(this.bViewOutline)
    	oItem = $(this.sIdItemOutline + oData.id);

    this.loadingInItem(oItem, false);

	if(oData && oData.form != undefined && oData.form_id != undefined) {
		oItem.find('.' + this.sClassItemContent).bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
            $(this).html(oData.form).bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed, function() {
            	$this.initFormEdit(oData.form_id);
            });
        });
	}
};

BxTimelineView.prototype.editPostCancel = function(oButton, iId) {
	this.editPost(oButton, iId);
};

BxTimelineView.prototype.deletePost = function(oLink, iId) {
    var $this = this;
    var oData = this._getDefaultData();
    oData['id'] = iId;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide();

    if(this.bViewTimeline)
    	this.loadingInItem($(this.sIdItemTimeline + iId), true);

    if(this.bViewOutline)
    	this.loadingInItem($(this.sIdItemOutline + iId), true);

    $.post(
        this._sActionsUrl + 'delete/',
        oData,
        function(oData) {
        	processJsonData(oData);
        },
        'json'
    );
};

BxTimelineView.prototype.onDeletePost = function(oData) {
	var $this = this;

	//--- Delete from 'Timeline' (if available)
	if(this.bViewTimeline) {
		$(this.sIdItemTimeline + oData.id).bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
	        $(this).remove();

	        if($this.oViewTimeline.find('.' + $this.sClassItem).length == 0) {
	        	$this.oViewTimeline.find('.' + $this.sClassDividerToday).hide();
	        	$this.oViewTimeline.find('.' + $this.sSP + '-load-more').hide();
	        	$this.oViewTimeline.find('.' + $this.sSP + '-empty').show();
	        }
	    });

		return;
	}

	//--- Delete from 'Outline' (if available)
	if(this.bViewOutline) {
		$(this.sIdItemOutline + oData.id).bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
	        $(this).remove();

	        if($this.oViewOutline.find('.' + $this.sClassItem).length == 0) {
	        	$this.destroyMasonry();

	        	$this.oViewOutline.find('.' + $this.sSP + '-load-more').hide();
	        	$this.oViewOutline.find('.' + $this.sSP + '-empty').show();
	        } 
	        else
	        	$this.reloadMasonry();
	    });

		return;
	}

	//--- Delete from 'View Item' page.
	if(this._sReferrer.length != 0)
		document.location = this._sReferrer;
};

BxTimelineView.prototype._getPosts = function(oElement, onComplete) {
	var $this = this;
	var oData = this._getDefaultData(oElement);

	jQuery.get(
        this._sActionsUrl + 'get_posts/',
        oData,
        function(oData) {
        	if(typeof onComplete === 'function')
        		return onComplete(oData);

        	$this.loadingInBlock(oElement, false);

        	processJsonData(oData);
        },
        'json'
    );
};

BxTimelineView.prototype._onGetPosts = function(oData) {
	var $this = this;
	var oView = $('#' + this._aHtmlIds['main_' + oData.view]);

	var onComplete = function() {
		if(oData && oData.load_more != undefined)
			oView.find('.' + $this.sSP + '-load-more-holder').html($.trim(oData.load_more));

		if(oData && oData.back != undefined)
			oView.find('.' + $this.sSP + '-back-holder').html($.trim(oData.back));

		if(oData && oData.empty != undefined)
			oView.find('.' + $this.sSP + '-empty-holder').html($.trim(oData.empty));
	};

	if(oData && oData.items != undefined) {
		var sItems = $.trim(oData.items);

		switch(oData.view) {
			case 'timeline':
				oView.find('.' + this.sClassItems).bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
					$(this).html(sItems).show().bxTime();

					$this.initFlickity();

					onComplete();
			    });
				break;

			case 'outline':
				oView.find('.' + this.sClassItems).bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
			        $(this).html(sItems).show().bxTime();

			        if($this.isMasonry())
			        	$this.destroyMasonry();

			        if(!$this.isMasonryEmpty())
			        	$this.initMasonry();

			        $this.initFlickity();

			        onComplete();
			    });
				break;
		}
	}	
};


BxTimelineView.prototype._onGetPost = function(oData) {
	if(!$.trim(oData.item).length) 
		return;

	var oItem = $(oData.item).bxTime();
	var oView = $('#' + this._aHtmlIds['main_' + oData.view]);

	switch(oData.view) {
		case 'timeline':
			oView.find(this.sIdItemTimeline + oData.id).replaceWith(oItem);
			break;

		case 'outline':
			oView.find(this.sIdItemOutline + oData.id).replaceWith(oItem);

			this.reloadMasonry();
			break;
	}
};
