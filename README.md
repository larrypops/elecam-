# Élections Camer - Application de Gestion Électorale

Ceci est une application Next.js conçue pour la gestion et l'analyse des résultats électoraux en temps réel. Elle offre un tableau de bord complet pour les administrateurs et une interface de saisie de données pour les agents des bureaux de vote.

## Fonctionnalités

- **Tableau de Bord Dynamique**: Visualisation des KPI clés (participation, votes, etc.) avec filtre par élection.
- **Saisie de Résultats**: Formulaire sécurisé pour la soumission des résultats par bureau de vote.
- **Gestion des Données**: Interfaces pour ajouter et gérer les élections, les candidats et les bureaux de vote.
- **Importation CSV**: Fonctionnalité d'importation en masse pour les bureaux de vote et les résultats.
- **Historique et Audit**: Journal de toutes les soumissions de données pour garantir la transparence.
- **Analyse Détaillée**: Tableau interactif pour explorer les résultats par bureau de vote avec tri et statistiques avancées.
- **Gestion des Procès-verbaux**: Page dédiée pour visualiser et exporter la liste des procès-verbaux soumis (visible par les Super Admins).

## Comment lancer le projet

Pour exécuter cette application sur votre machine locale, veuillez suivre les étapes ci-dessous.

### Prérequis

Assurez-vous d'avoir installé les logiciels suivants :
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- [npm](https://www.npmjs.com/) (généralement inclus avec Node.js)

### 1. Installation

Une fois que vous avez décompressé le fichier ZIP, ouvrez un terminal et naviguez jusqu'au répertoire racine du projet. Ensuite, exécutez la commande suivante pour installer toutes les dépendances nécessaires :

```bash
npm install
```

### 2. Lancement de l'application

Après avoir installé les dépendances, lancez le serveur de développement avec la commande :

```bash
npm run dev
```

L'application sera alors accessible à l'adresse [http://localhost:9002](http://localhost:9002) dans votre navigateur.

Vous pouvez maintenant vous connecter avec les identifiants par défaut (voir `src/contexts/data-context.tsx`) et commencer à explorer l'application.
