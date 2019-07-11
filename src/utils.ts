import * as vscode from 'vscode';
import { UriOptions } from 'request';
import { statusbarRepository } from "./statusBarHelper";
import * as fs from 'fs';
import * as path from 'path';
import { config } from "./config";

export module utils {


	let channel: vscode.OutputChannel;
	export function getOutputChannel(): vscode.OutputChannel {
		if (!channel) {
			channel = vscode.window.createOutputChannel('hostbridge');
		}
		return channel;
	}	


	let passwords: []|undefined = [];
	export async function getPassword(targetRepo:any) {

		let hostAndRegion = `${targetRepo.host}:${targetRepo.region}`;

		if (!passwords[hostAndRegion]) {
			passwords[hostAndRegion] = await vscode.window.showInputBox({
				password: true,
				prompt: "Please enter password for ",	
				validateInput: text => {
					return text.length === 0 ? 'Password is required!' : null;
				},
			});
		}
		return passwords[hostAndRegion];
	}
	export function setPassword(targetRepo:any, val: string|undefined) {
		let hostAndRegion = targetRepo.host + ":" + targetRepo.region;
		passwords[hostAndRegion] = val;
	}


	export function openHostContent(filename:string, content:string) {

		// use config setting for temp root if provided.  otherwise default to workspace
		let tempFolderRoot:string = config.get().get('tempFolderRoot') ||
									vscode.workspace.workspaceFolders[0].uri.fsPath;
		
		if (tempFolderRoot) {

			// can be something.. can be nothing..  defaults via package.json to HostBridge\tempFiles.
			let tempFolderName:string = config.get().get('tempFolderName') || "";

			let pathAndFilename = path.join(tempFolderRoot, tempFolderName, filename);
			fs.writeFileSync(pathAndFilename, content);

			const finalUri = vscode.Uri.file(pathAndFilename);
			vscode.workspace.openTextDocument(finalUri).then((doc) => {
				vscode.window.showTextDocument(doc, {preview: false});
			});
		}
		else {
			vscode.window.showInformationMessage('Temp folder could not be determined.  Opening virtually.  Set tempFolderRoot setting to allow saving to disk.');
			openNewNamedVirtualDoc(filename, content);
		}
	}


	export function openNewNamedVirtualDoc(filename: string, content: string) {
		let uri: vscode.Uri = vscode.Uri.parse("untitled:" + filename);

		vscode.workspace.openTextDocument(uri).then((doc) => {
			vscode.window.showTextDocument(doc, 1, false).then(e => {
			e.edit(edit => {
				edit.insert(new vscode.Position(0, 0), content);
			});
			});
		}, (error) => {
			getOutputChannel().appendLine(error);
			getOutputChannel().show(true); 
		});
	}

	let HbActionsToMethods:any = {
		'RUN': 'POST',
		'MAKE': 'POST',
		'LIST2': 'POST',
		'DELETE': 'DELETE',
		'GET': 'POST',
		'PUT': 'PUT'
	};


	/// action = MAKE or RUN
	export function getHttpOptions(o:any): UriOptions {

		let host = config.getHost(o.targetRepo.host);
		let region = config.getRegion(o.targetRepo.host, o.targetRepo.region);

		let method:any = HbActionsToMethods[o.action];

		let hostAndRegion = `${host.name}:${region.name}`;

		let options:any =
		{							
			method: method,
			uri: `${region.protocol}://${host.name}:${region.port}/${o.targetRepo.repository}/${(method==='POST') ? 'mscript' : o.filename}`,
			headers: {			
				'X-HB-ACTION': o.action,
				'X-HB-ACTION-TARGET': o.filename,
				'X-HB-DEFAULT-REPOSITORY': o.targetRepo.repository,
				'Authorization': "Basic " + Buffer.from(`${region.userid}:${passwords[hostAndRegion]}`).toString('base64'),
				'Content-Type': (method === 'POST') ? 'text/plain' : 'application/x-www-form-urlencoded',
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache'				
			}
		};

		if (o.contents) {
			options.body = encodeData(o.contents);
		}

		if (method !== 'DELETE') {
			options.headers['X-HB-TRANSLATE'] = 'text';
		}

		if (o.resolveWithFullResponse) {
			options.resolveWithFullResponse = o.resolveWithFullResponse;
		}

		return options;
	}	


	export function getActiveRepository() {
		let pieces = statusbarRepository.text.split("\\");

		if (pieces.length !== 3) {
		 	vscode.commands.executeCommand('extension.updateActiveRepository');
		}

		return {
			host: pieces[0],
			region: pieces[1],
			repository: pieces[2]
		};
	}
	

	/**
	 * Formats the raw host datetime CCYYMMDDHHMMSS into CCYY/MM/DD HH:MM:SS
	 * @param dateTime Raw unformatted 8-digit date and 6-digit time with no delimiters (CCYYMMDDHHMMSS)
	 */
	export function formatHostDateTime(dateTime:string) {
		//updated_on:"20190411093844";		
		return dateTime.substr(0,4) + "/" + dateTime.substr(4,2) + "/" + dateTime.substr(6,2) + " " + dateTime.substr(8,2) + ":" + dateTime.substr(10,2) + ":" + dateTime.substr(12,2);
	}


	/**
	 * Convert data to Hostbridge-specific encoding
	 * @param data file contents to be encoded
	 */
	function encodeData(data:string): string {

		let buf:string = "";
		let ch:string = "";

		for (let i = 0; i < data.length; i++) {
			ch = data.charAt(i);

		  	if (ch === '\t' || ch === '\n') {
				buf += ch;
			} 
			else if (ch < ' ' || ch > '~' || ch === '+' || ch === '%') {
				buf += '%';
				let hex:string = ch.charCodeAt(0).toString(16);
				if (hex.length === 1) {
					  buf += '0'; 
				}
				buf += (hex.toUpperCase());
		  	}
		  	else if (ch === ' ') {
				buf += '+';
		  	} else {
				buf += ch;
		  	} 
		} 

		return buf;
	  }
	
}