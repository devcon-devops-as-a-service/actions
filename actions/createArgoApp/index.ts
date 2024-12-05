import { error, getInput } from '@actions/core';
import { context } from '@actions/github';
import { writeFileSync } from 'fs';
import { ProjectInfo } from '../common';

const createYamlText = (appName: string, projects: string[]) => {
    const imagesList = projects
        .sort()
        .map(p => `acrdeccondemo.azurecr.io/${p}:^1.0.0`)
        .join(',');

    const content = `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  annotations:
     argocd-image-updater.argoproj.io/image-list: ${imagesList}
     argocd-image-updater.argoproj.io/write-back-method: argocd
     argocd-image-updater.argoproj.io/reduced.force-update: "true"
     
  name: ${appName}
spec:
  destination:
    name: ""
    namespace: ${appName}
    server: https://kubernetes.default.svc
  source:
    path: docker/k8s/chart
    repoURL: https://github.com/${context.repo.owner}/${context.repo.repo}.git
    targetRevision: master
  sources: []
  project: default
  syncPolicy:
    automated:
      prune: false
      selfHeal: false`;

    return content;
};

const main = async () => {
    const servicesText = getInput('services');

    if (!servicesText?.length) {
        error('services input is null');
    }

    const appName = getInput('appName');

    const projects = JSON.parse(servicesText).include as ProjectInfo[];

    const yamlText = createYamlText(
        appName,
        projects.map(p => p.project)
    );

    console.log(yamlText);

    writeFileSync('./argocd/app.yml', yamlText);
};

main();
