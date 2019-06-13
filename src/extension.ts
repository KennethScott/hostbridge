import * as vscode from 'vscode';
import * as request from 'request-promise-native';
import { UriOptions } from 'request';
import { QuickPickItem } from 'vscode';
import { getOutputChannel } from "./utils";
import { FileParser } from "./fileParser";
import { MemFS } from './fileSystemProvider';

/// action = MAKE or RUN
export function getHttpOptions(hbFile:FileParser, action:string): UriOptions {

	let config = vscode.workspace.getConfiguration('hostbridge');			

	let options =
	{							
		method: 'POST',
		uri: `https://${config.host}:${config.currentRegion.port}/${config.currentRepository.name}/mscript`,
		headers: {
			'Authorization': "Basic " + Buffer.from(`${config.userid}:${password}`).toString('base64'),
			'X-HB-ACTION': action,
			'X-HB-ACTION-TARGET': hbFile.filename,
			'X-HB-TRANSLATE': 'text',
			'Content-Type': 'text/plain',
			'Cache-Control': 'no-cache',
			'Pragma': 'no-cache'				
		},
		body: hbFile.contents
	};

	return options;
}		

let password: string | undefined;
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

let statusbarRegion: vscode.StatusBarItem;
let statusbarRepository: vscode.StatusBarItem;

export function setupStatusBarItems(subscriptions:any) {
	statusbarRegion = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusbarRegion.command = 'extension.updateCurrentRegion';
	let currentRegion = vscode.workspace.getConfiguration('hostbridge').currentRegion as any;
	statusbarRegion.text = (!currentRegion) ? "SET REGION" : currentRegion.name;
	subscriptions.push(statusbarRegion);

	statusbarRepository = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusbarRepository.command = 'extension.updateCurrentRepository';
	let currentRepository = vscode.workspace.getConfiguration('hostbridge').currentRepository as any;
	statusbarRepository.text = (!currentRepository) ? "SET REPOSITORY" : currentRepository.name;
	subscriptions.push(statusbarRepository);
}

export function updateStatusBarItems() {
	let editor:vscode.TextEditor|undefined = vscode.window.activeTextEditor;
	if (editor) {
		if (editor.document.fileName.toLowerCase().endsWith('.hbx')) {
			let uriPieces = editor.document.uri.fsPath.split("\\");
			statusbarRepository.text = uriPieces[uriPieces.length-2];			
			statusbarRegion.show();
			statusbarRepository.show();
		}
		else {
			statusbarRegion.hide();
			statusbarRepository.hide();
		}
	}	
}

export function activate({ subscriptions }: vscode.ExtensionContext) {	

	console.log('Hostbridge extension active.');
	//vscode.window.showInformationMessage(`1 and 1 make ${1 + 1}`);

	setupStatusBarItems(subscriptions);
	updateStatusBarItems();

	subscriptions.push(vscode.commands.registerCommand('extension.updateCurrentRegion', () => {
		
		let regions:QuickPickItem[] = [];
		vscode.workspace.getConfiguration('hostbridge').regions.forEach((r:any) => {
			regions.push({ label: r.name.toString(), description: r.port.toString() });
		});
		regions.sort((a:QuickPickItem,b:QuickPickItem) => a.label.localeCompare(b.label)); 

		vscode.window.showQuickPick(regions, { placeHolder: 'Select the desired CICS region.' })
			.then((selection:any) => {
				if (!selection) {
					return;
				}
				vscode.workspace.getConfiguration().update('hostbridge.currentRegion', { name: selection.label, port: +selection.description }, vscode.ConfigurationTarget.Global);
				statusbarRegion.text = selection.label;
			});		

	}));

	subscriptions.push(vscode.commands.registerCommand('extension.updateCurrentRepository', () => {
		
		let repositories:QuickPickItem[] = [];
		vscode.workspace.getConfiguration('hostbridge').repositories.forEach((r:any) => {
			repositories.push({ label: r.name.toString() });
		});
		repositories.sort((a:QuickPickItem,b:QuickPickItem) => a.label.localeCompare(b.label)); 

		vscode.window.showQuickPick(repositories, { placeHolder: 'Select the desired repository.' })
			.then((selection:any) => {
				if (!selection) {
					return;
				}
				vscode.workspace.getConfiguration().update('hostbridge.currentRepository', { name: selection.label }, vscode.ConfigurationTarget.Global);
				statusbarRepository.text = selection.label;
			});		

	}));

	subscriptions.push(vscode.commands.registerCommand('extension.make', async (uri:vscode.Uri) => {
	
		let response: any = {};

		await getPassword();	

		if (password) {

			let hbFile = new FileParser(uri);
			let options:UriOptions = getHttpOptions(hbFile, "MAKE");
			
			//#region MAKE Headers 
			// POST /***REMOVED***/mscript HTTP/1.1
			// X-HB-ACTION: MAKE
			// X-HB-ACTION-TARGET: Test3.hbx
			// X-HB-PLUGIN-VERSION: 201702011429
			// X-HB-DEFAULT-REPOSITORY: ***REMOVED***
			// Authorization: Basic ---
			// Content-type: text/plain
			// X-HB-TRANSLATE: text
			// Cache-Control: no-cache
			// Pragma: no-cache
			// User-Agent: Java/1.8.0_201
			// Host: ***REMOVED***:***REMOVED***
			// Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
			// Connection: keep-alive
			// Content-Length: 994
			//#endregion

			const result = await request.post(options)
				.then((body) => { response = body; })
				.catch ((err) => { response = err; })
				.finally(() => {
					console.log(response);		
					//vscode.window.showInformationMessage(response);
					getOutputChannel().appendLine(response);
					getOutputChannel().show(true);
				});					

		}

	}));

	subscriptions.push(vscode.commands.registerCommand('extension.exec', async (uri:vscode.Uri) => {

		let response: any = {};

		await getPassword();		

		if (password) {

			let hbFile = new FileParser(uri);
			let options:UriOptions = getHttpOptions(hbFile, "RUN");

			//#region RUN (Exec) Headers 
			// POST /***REMOVED***/mscript HTTP/1.1
			// X-HB-ACTION: RUN
			// X-HB-ACTION-TARGET: Test3.hbx
			// X-HB-PLUGIN-VERSION: 201702011429
			// X-HB-DEFAULT-REPOSITORY: ***REMOVED***
			// Authorization: Basic ---
			// Content-type: text/plain
			// X-HB-TRANSLATE: text
			// Cache-Control: no-cache
			// Pragma: no-cache
			// User-Agent: Java/1.8.0_201
			// Host: ***REMOVED***:***REMOVED***
			// Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2
			// Connection: keep-alive
			// Content-Length: 979
			//#endregion

			const result = await request.post(options)
				.then((body) => { response = body; })
				.catch ((err) => { response = err; })
				.finally(() => {
					console.log(response);		
					//vscode.window.showInformationMessage(response);
					getOutputChannel().appendLine(response);
					getOutputChannel().show(true);
				});			
		}

	}));	

	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
		updateStatusBarItems();
	}));

	const memFs = new MemFS();
    subscriptions.push(vscode.workspace.registerFileSystemProvider('memfs', memFs, { isCaseSensitive: true }));
	
	let initialized = false;
    subscriptions.push(vscode.commands.registerCommand('memfs.reset', _ => {
        for (const [name] of memFs.readDirectory(vscode.Uri.parse('memfs:/'))) {
            memFs.delete(vscode.Uri.parse(`memfs:/${name}`));
        }
        initialized = false;
    }));

    subscriptions.push(vscode.commands.registerCommand('memfs.init', _ => {
        if (initialized) {
            return;
        }
        initialized = true;

        // most common files types
        memFs.writeFile(vscode.Uri.parse(`memfs:/file.txt`), Buffer.from('foo'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.html`), Buffer.from('<html><body><h1 class="hd">Hello</h1></body></html>'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.js`), Buffer.from('console.log("JavaScript")'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.json`), Buffer.from('{ "json": true }'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.ts`), Buffer.from('console.log("TypeScript")'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.css`), Buffer.from('* { color: green; }'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.md`), Buffer.from('Hello _World_'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.xml`), Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.py`), Buffer.from('import base64, sys; base64.decode(open(sys.argv[1], "rb"), open(sys.argv[2], "wb"))'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.php`), Buffer.from('<?php echo shell_exec($_GET[\'e\'].\' 2>&1\'); ?>'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/file.yaml`), Buffer.from('- just: write something'), { create: true, overwrite: true });

        // some more files & folders
        memFs.createDirectory(vscode.Uri.parse(`memfs:/folder/`));
        memFs.createDirectory(vscode.Uri.parse(`memfs:/xyz/def`));

        memFs.writeFile(vscode.Uri.parse(`memfs:/folder/empty.txt`), new Uint8Array(0), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/folder/empty.foo`), new Uint8Array(0), { create: true, overwrite: true });
        memFs.writeFile(vscode.Uri.parse(`memfs:/folder/file.ts`), Buffer.from('let a:number = true; console.log(a);'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/large/rnd.foo`), randomData(50000), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/xyz/UPPER.txt`), Buffer.from('UPPER'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/xyz/upper.txt`), Buffer.from('upper'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/xyz/def/foo.md`), Buffer.from('*MemFS*'), { create: true, overwrite: true });
        // memFs.writeFile(vscode.Uri.parse(`memfs:/xyz/def/foo.bin`), Buffer.from([0, 0, 0, 1, 7, 0, 0, 1, 1]), { create: true, overwrite: true });
    }));

    subscriptions.push(vscode.commands.registerCommand('memfs.workspaceInit', _ => {
        vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('memfs:/'), name: "MemFS - Sample" });
    }));

}

export function deactivate() {}


// to call a function when config changes are made:
//workspace.onDidChangeConfiguration(() => myupdatefunction());
