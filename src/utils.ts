import * as vscode from 'vscode';
import { UriOptions } from 'request';

let _channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
	if (!_channel) {
		_channel = vscode.window.createOutputChannel('Hostbridge');
	}
	return _channel;
}


export let password: string|undefined;
export async function getPassword() {
	if (!password) {
		password = await vscode.window.showInputBox({
			password: true,
			prompt: "Please enter your CESN/RACF password.",	
			validateInput: text => {
				return text.length === 0 ? 'Password is required!' : null;
			},
		});
	}
	return password;
}

export async function openInUntitled(content: string, language?: string) {
    const document = await vscode.workspace.openTextDocument({
        language,
        content,
    });
    vscode.window.showTextDocument(document);
}

let HbActionsToMethods:any = {
	'RUN': 'POST',
	'MAKE': 'POST',
	'LIST2': 'POST',
	'DELETE': 'DELETE',
	'GET': 'POST',
};

/// action = MAKE or RUN
export function getHttpOptions(o:any): UriOptions {

	let config = vscode.workspace.getConfiguration('hostbridge');			

	let method:any = HbActionsToMethods[o.action];

	let options:any =
	{							
		method: method,
		uri: `https://${config.host}:${o.port}/${o.repository}/${method==='DELETE' ? o.filename : 'mscript'}`,
		headers: {			
			'X-HB-ACTION': o.action,
			'X-HB-ACTION-TARGET': o.filename,
			'X-HB-DEFAULT-REPOSITORY': o.repository,
			'Authorization': "Basic " + Buffer.from(`${config.userid}:${password}`).toString('base64'),
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

	return options;
}	

// find a sort extension..
