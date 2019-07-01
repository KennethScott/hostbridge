import * as vscode from 'vscode';
import { UriOptions } from 'request';
import { statusbarRepository } from "./statusBarHelper";

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
				prompt: "Please enter your CESN/RACF password.",	
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

		let config = vscode.workspace.getConfiguration('hostbridge');	

		let host = config.hosts.find(x => x.name === o.targetRepo.host);
		let region = host.regions.find(x => x.name === o.targetRepo.region);

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
			options.body = o.contents;
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
	// find a sort extension..
}