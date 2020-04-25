/*
 * Copyright (c) 2010-2020 SAP and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *   SAP - initial API and implementation
 */
angular.module('preview', [])
.factory('$messageHub', [function(){
	var messageHub = new FramesMessageHub();	
	var message = function(evtName, data){
		messageHub.post({data: data}, evtName);
	};
	var on = function(topic, callback){
		messageHub.subscribe(callback, topic);
	};
	return {
		message: message,
		on: on
	};
}])
.directive('iframeOnload', [function(){
	return {
		scope: {
			callBack: '&iframeOnload'
		},
		link: function(scope, element, attrs){
			element.on('load', function(){
				return scope.callBack();
			})
		}
	}
}])
.controller('PreviewController', ['$scope', '$messageHub', function ($scope, $messageHub) {

	this.refresh = function() {
		var url = this.previewUrl;
		if (url) {
			url = url.indexOf('?refreshToken') > 0 ? url.substring(0, url.indexOf('?refreshToken')) : url;
			this.previewUrl = url + '?refreshToken=' + new Date().getTime();
		}
	};

	this.iframeLoadedCallBack = function() {
		const element = document.querySelector('.preview-pre');
		var iframe = document.getElementById('preview-iframe');
		var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
		if (iframeDocument) {
			if (iframeDocument.getElementsByTagName("body").length === 1 
			        && iframeDocument.getElementsByTagName("body")[0].outerText) {
				iframeDocument.getElementsByTagName("body")[0].style.color = getComputedStyle(element).color;
				iframeDocument.getElementsByTagName("body")[0].style['font-family'] = getComputedStyle(element)['font-family'];
			}
			if (iframeDocument.getElementsByTagName('pre')[0]
					&& iframeDocument.getElementsByTagName('pre').length === 1) {
				iframeDocument.getElementsByTagName('pre')[0].style.color = getComputedStyle(element).color;
				$messageHub.message('status.message', 'Preview ' + this.previewUrl);
			}
		}
    }
    
	$messageHub.on('workspace.file.selected', function(msg) {
		var resourcePath = msg.data.path.substring(msg.data.path.indexOf('/', 1));
		var url = window.location.protocol + '//' + window.location.host +  window.location.pathname.substr(0, window.location.pathname.indexOf('/web/'));
		var type = resourcePath.substring(resourcePath.lastIndexOf('.') + 1);
		switch(type) {
			case 'rhino':
				url += '/rhino';
				break;
			case 'nashorn':
				url += '/nashorn';
				break;
			case 'v8':
				url += '/v8';
				break;
			case 'graalvm':
				url += '/graalvm';
				break;
			case 'js':
				url += '/js';
				break;
			case 'xsjs':
				url += '/xsc';
				break;
			case 'md':
				url += '/wiki';
				break;
			case 'command':
				url += '/command';
				break;
			case 'edm':
			case 'dsm':
			case 'bpmn':
			case 'job':
			case 'listener':
			case 'extensionpoint':
			case 'extension':
			case 'table':
			case 'view':
			case 'access':
			case 'roles':
			case 'sh':
				return;
			default:
				url += '/web';
		}
		url += resourcePath;
		this.previewUrl = url;
		$scope.$apply();
	}.bind(this));
	
	$messageHub.on('workspace.file.published', function(msg) {
		this.refresh();
		$scope.$apply();
	}.bind(this));

	$scope.cancel = function(e) {
		if (e.keyCode === 27) {
			$scope.previewForm.preview.$rollbackViewValue();
		}
	};

}]).config(function($sceProvider) {
    $sceProvider.enabled(false);
});
