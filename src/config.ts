import * as vscode from 'vscode';

export module config {

    let config:vscode.WorkspaceConfiguration;
    
	export function get(): vscode.WorkspaceConfiguration {
		if (!config) {
            config = vscode.workspace.getConfiguration('hostbridge');
		}
		return config;
	}
    export function reset() { config = null; }    

    export function getHosts() {
        return config.hosts;
    }

    export function getHost(hostName:string) {
        return getHosts().find(x => x.name === hostName);
    }

    export function getRegions(hostName:string) {
        return getHost(hostName).regions;
    }

    export function getRegion(hostName:string, regionName:string) {
        return getRegions(hostName).find(x => x.name === regionName);
    }

    export function getRepositories(hostName:string, regionName:string) {
        return getRegion(hostName, regionName).repositories;
    }

}
