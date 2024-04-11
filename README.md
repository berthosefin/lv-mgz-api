# API NestJS pour la Gestion de Magasin

Cette API NestJS fournit des fonctionnalités pour gérer les articles, les transactions et les utilisateurs d'un système de gestion de magasin. Elle est conçue pour être utilisée dans le cadre d'une application de gestion de magasin.

## Installation

1. Clonez ce dépôt sur votre machine locale.
2. Assurez-vous d'avoir Node.js et npm installés sur votre machine.
3. Exécutez `npm install` pour installer les dépendances.
4. Configurez vos paramètres de connexion (`DATABASE_URL`) dans le fichier `.env`.
5. Exécutez `npm run start` pour lancer le serveur.

## Fonctionnalités Principales

### Gestion des Articles

- **Création d'un nouvel article** : Permet de créer un nouvel article dans un magasin.
- **Récupération de tous les articles** : Récupère tous les articles d'un magasin, avec prise en charge de la pagination.
- **Vente d'articles** : Permet de vendre des articles et de mettre à jour le stock.
- **Récupération d'un article par ID** : Permet de récupérer un article spécifique en fonction de son identifiant.
- **Reconstitution du stock d'un article** : Permet de réapprovisionner le stock d'un article spécifique.

### Gestion des Transactions

- **Création d'une nouvelle transaction** : Permet de créer une nouvelle transaction.
- **Récupération de toutes les transactions par caisse** : Récupère toutes les transactions effectuées sur une caisse donnée, avec prise en charge de la pagination et du filtrage par type et plage de dates.
- **Comptage du nombre total de transactions par caisse** : Fournit le nombre total de transactions effectuées sur une caisse spécifique.

### Utilisateurs

- **Création d'un nouvel utilisateur avec magasin et caisse** : Permet de créer un nouvel utilisateur avec des informations de magasin et de caisse associées.
- **Récupération d'un utilisateur par nom d'utilisateur** : Permet de récupérer les détails d'un utilisateur en fonction de son nom d'utilisateur.

## Utilisation

L'API fournit des points de terminaison RESTful pour interagir avec les services mentionnés ci-dessus. Voici quelques exemples d'utilisation :

- `POST /articles` : Crée un nouvel article.
- `GET /articles` : Récupère tous les articles d'un magasin.
- `POST /articles/sell` : Vente d'articles.
- `GET /articles/:id` : Récupère un article par ID.
- `PATCH /articles/:id` : Réapprovisionne le stock d'un article.
- `POST /transactions` : Crée une nouvelle transaction.
- `GET /transactions` : Récupère toutes les transactions par caisse.
- `GET /transactions/count` : Compte le nombre total de transactions par caisse.
- `POST /users` : Crée un nouvel utilisateur avec des détails associés.
- `GET /users/:username` : Récupère les détails d'un utilisateur par nom d'utilisateur.

Pour plus de détails sur les endpoints disponibles et leurs paramètres, référez-vous à la documentation Swagger générée automatiquement.
