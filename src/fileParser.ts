import * as vscode from 'vscode';
import * as fs from 'fs';

export class FileParser {

	public filename:string;
	public folder:string;
	public contents:string = "";

	constructor(uri:vscode.Uri, readFile:boolean = true) {
		let uriPieces = uri.fsPath.split("\\");
		this.filename = uriPieces[uriPieces.length-1];
		this.folder = uriPieces[uriPieces.length-2];	
		// no idea why this doesn't seem to work..
		// vscode.workspace.openTextDocument(uri).then((document) => {
		// 	fileContents = document.getText();
        // });
        if (readFile) { this.contents = fs.readFileSync(uri.fsPath, 'utf-8'); }
	}
}
