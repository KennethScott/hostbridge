import * as vscode from 'vscode';

export function get() {
    return vscode.workspace.getConfiguration('hostbridge');
}   

export function getHosts() {
    return get().hosts;
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
