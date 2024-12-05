import { error, getInput } from '@actions/core';
import { context } from '@actions/github';
import { writeFileSync } from 'fs';

const createYamlText = (appName: string, projects: string[]) => {
    const imagesList = projects
        .map(p => `     argocd-image-updater.argoproj.io/image-list: acrdeccondemo.azurecr.io/${p}:^1.0.0`)
        .join('\n');

    const content = `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  annotations:
${imagesList}
     argocd-image-updater.argoproj.io/write-back-method: argocd
     argocd-image-updater.argoproj.io/reduced.force-update: "true"
     
  name: ${appName}
spec:
  destination:
    name: ''
    namespace: 'default'
    server: 'https://kubernetes.default.svc'
  source:
    path: docker/k8s/chart
    repoURL: https://github.com/devcon-devops-as-a-service/${context.repo}.git
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
    const projectsText = getInput('projects');

    if (!projectsText?.length) {
        error('Projects input is null');
    }

    const appName = getInput('appName');

    const projects = JSON.parse(projectsText) as string[];

    const yamlText = createYamlText(appName, projects);

    writeFileSync('./argocd/app.yaml', yamlText);
};

main();