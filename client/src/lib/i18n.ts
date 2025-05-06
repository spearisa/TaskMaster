import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      common: {
        appName: 'Appmo',
        appMenu: 'Appmo Menu',
        language: 'Language',
        region: 'Region',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        settings: 'Settings',
        help: 'Help',
        about: 'About',
        back: 'Back',
        next: 'Next',
        confirm: 'Confirm',
        close: 'Close',
        done: 'Done',
        apply: 'Apply',
        reset: 'Reset',
        notFound: 'Not Found',
        welcome: 'Welcome',
        logout: 'Logout',
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        signUp: 'Sign Up',
        signIn: 'Sign In',
        createAccount: 'Create Account',
        forgotPassword: 'Forgot Password',
        resetPassword: 'Reset Password',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        username: 'Username',
        rememberMe: 'Remember Me',
        continueWith: 'Continue with',
        orSignInWith: 'Or sign in with',
        orSignUpWith: 'Or sign up with',
        alreadyHaveAccount: 'Already have an account?',
        dontHaveAccount: "Don't have an account?",
        socialAuth: {
          google: 'Google',
          facebook: 'Facebook',
          twitter: 'Twitter',
          github: 'GitHub',
        }
      },
      admin: {
        login: 'Admin Login',
        dashboard: 'Admin Dashboard',
        userManagement: 'User Management',
        blogManagement: 'Blog Management',
        statistics: 'Statistics',
        siteSettings: 'Site Settings',
        accessDenied: 'Access Denied',
        adminArea: 'Admin Area',
      },
      navigation: {
        tasks: 'My Tasks',
        assignedTasks: 'Assigned Tasks',
        publicTasks: 'Public Tasks',
        calendar: 'Calendar',
        messenger: 'Messages',
        aiTools: 'AI Assistant',
        apiDocs: 'API Docs',
        profile: 'Profile',
        settings: 'Settings',
        help: 'Help',
        back: 'Back',
        openMenu: 'Open Menu',
        closeMenu: 'Close Menu',
        menu: 'Menu',
        mainNavigation: 'Main Navigation',
        sideNavigation: 'Side Navigation',
        bottomNavigation: 'Bottom Navigation',
        marketplace: 'Marketplace',
      },
      tasks: {
        task: 'Task',
        tasks: 'Tasks',
        newTask: 'New Task',
        completedTasks: 'Completed Tasks',
        myTasks: 'My Tasks',
        assignedTasks: 'Assigned Tasks',
        taskDetails: 'Task Details',
        taskTitle: 'Task Title',
        taskDescription: 'Description',
        dueDate: 'Due Date',
        priorityLabel: 'Priority',
        statusLabel: 'Status',
        assignedTo: 'Assigned To',
        createdBy: 'Created By',
        attachments: 'Attachments',
        labels: 'Labels',
        addLabel: 'Add Label',
        createTask: 'Create Task',
        editTask: 'Edit Task',
        deleteTask: 'Delete Task',
        completeTask: 'Complete Task',
        templates: 'Templates',
        bidAmount: 'Bid Amount',
        bidDetails: 'Bid Details',
        submitBid: 'Submit Bid',
        cancelBid: 'Cancel Bid',
        acceptBid: 'Accept Bid',
        rejectBid: 'Reject Bid',
        bidStatus: 'Bid Status',
        pendingBids: 'Pending Bids',
        acceptedBids: 'Accepted Bids',
        rejectedBids: 'Rejected Bids',
        shareTask: 'Share Task',
        makePulic: 'Make Public',
        makePrivate: 'Make Private',
        priority: {
          high: 'High',
          medium: 'Medium',
          low: 'Low',
        },
        status: {
          todo: 'To Do',
          inProgress: 'In Progress',
          completed: 'Completed',
          cancelled: 'Cancelled',
          delegated: 'Delegated',
        }
      },
      calendar: {
        today: 'Today',
        day: 'Day',
        week: 'Week',
        month: 'Month',
        events: 'Events',
        newEvent: 'New Event',
        eventDetails: 'Event Details',
        allDay: 'All Day',
        startDate: 'Start Date',
        endDate: 'End Date',
        startTime: 'Start Time',
        endTime: 'End Time',
        location: 'Location',
        participants: 'Participants',
        reminder: 'Reminder',
        addReminder: 'Add Reminder',
        reminderTime: 'Reminder Time',
        reminderType: 'Reminder Type',
      },
      messages: {
        messages: 'Messages',
        newMessage: 'New Message',
        sendMessage: 'Send Message',
        typeMessage: 'Type a message...',
        searchMessages: 'Search Messages',
        noMessages: 'No Messages',
        noConversations: 'No Conversations',
        startConversation: 'Start a Conversation',
        directMessage: 'Direct Message',
        searchUsers: 'Search Users',
        online: 'Online',
        offline: 'Offline',
        typing: 'typing...',
        delivered: 'Delivered',
        seen: 'Seen',
        unseen: 'Unseen',
        reactions: 'Reactions',
        addReaction: 'Add Reaction',
        deleteMessage: 'Delete Message',
        editMessage: 'Edit Message',
      },
      profile: {
        myProfile: 'My Profile',
        editProfile: 'Edit Profile',
        username: 'Username',
        email: 'Email',
        fullName: 'Full Name',
        firstName: 'First Name',
        lastName: 'Last Name',
        phoneNumber: 'Phone Number',
        bio: 'Bio',
        location: 'Location',
        website: 'Website',
        company: 'Company',
        position: 'Position',
        skills: 'Skills',
        interests: 'Interests',
        education: 'Education',
        experience: 'Experience',
        languages: 'Languages',
        socialMedia: 'Social Media',
        settings: 'Settings',
        notifications: 'Notifications',
        darkMode: 'Dark Mode',
        privacy: 'Privacy',
        security: 'Security',
        taskStatistics: 'Task Statistics',
        completedTasks: 'Completed Tasks',
        pendingTasks: 'Pending Tasks',
        delegatedTasks: 'Delegated Tasks',
        taskCompletion: 'Task Completion',
      },
      ai: {
        aiAssistant: 'AI Assistant',
        aiTools: 'AI Tools',
        askAI: 'Ask AI',
        generateWithAI: 'Generate with AI',
        promptForAI: 'What can I help you with?',
        promptPlaceholder: 'Ask me anything about your tasks or productivity...',
        thinking: 'Thinking...',
        generating: 'Generating...',
        taskSuggestions: 'Task Suggestions',
        taskOptimization: 'Task Optimization',
        dailySchedule: 'Daily Schedule',
        taskDelegation: 'Task Delegation',
        imageGeneration: 'Image Generation',
        codeGeneration: 'Code Generation',
        contentGeneration: 'Content Generation',
        models: 'Models',
        openai: 'OpenAI GPT-4o',
        anthropic: 'Anthropic Claude',
      },
      api: {
        apiDocumentation: 'API Documentation',
        apiKeys: 'API Keys',
        createApiKey: 'Create API Key',
        revokeApiKey: 'Revoke API Key',
        apiKeyName: 'API Key Name',
        apiKeyCreated: 'API Key Created',
        apiKeyRevoked: 'API Key Revoked',
        endpoints: 'Endpoints',
        parameters: 'Parameters',
        responses: 'Responses',
        authentication: 'Authentication',
        examples: 'Examples',
        errorCodes: 'Error Codes',
        rateLimit: 'Rate Limit',
        version: 'Version',
      },
      error: {
        notFound: 'Page Not Found',
        serverError: 'Server Error',
        unauthorized: 'Unauthorized',
        forbidden: 'Forbidden',
        badRequest: 'Bad Request',
        networkError: 'Network Error',
        unknownError: 'Unknown Error',
        tryAgain: 'Please try again',
        goBack: 'Go Back',
        contactSupport: 'Contact Support',
        pageNotFoundMessage: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
        requestedUrl: 'Requested URL'
      }
    }
  },
  es: {
    translation: {
      common: {
        appName: 'Appmo',
        appMenu: 'Menú Appmo',
        language: 'Idioma',
        region: 'Región',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        search: 'Buscar',
        settings: 'Configuración',
        help: 'Ayuda',
        about: 'Acerca de',
        back: 'Atrás',
        next: 'Siguiente',
        confirm: 'Confirmar',
        close: 'Cerrar',
        done: 'Hecho',
        apply: 'Aplicar',
        reset: 'Restablecer',
        notFound: 'No Encontrado',
        welcome: 'Bienvenido',
        logout: 'Cerrar Sesión',
      },
      auth: {
        login: 'Iniciar Sesión',
        logout: 'Cerrar Sesión',
        signUp: 'Registrarse',
        signIn: 'Iniciar Sesión',
        createAccount: 'Crear Cuenta',
        forgotPassword: 'Olvidé mi Contraseña',
        resetPassword: 'Restablecer Contraseña',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar Contraseña',
        username: 'Nombre de Usuario',
        rememberMe: 'Recordarme',
        continueWith: 'Continuar con',
        orSignInWith: 'O iniciar sesión con',
        orSignUpWith: 'O registrarse con',
        alreadyHaveAccount: '¿Ya tienes una cuenta?',
        dontHaveAccount: "¿No tienes una cuenta?",
        socialAuth: {
          google: 'Google',
          facebook: 'Facebook',
          twitter: 'Twitter',
          github: 'GitHub',
        }
      },
      admin: {
        login: 'Acceso Admin',
        dashboard: 'Panel de Admin',
        userManagement: 'Gestión de Usuarios',
        blogManagement: 'Gestión del Blog',
        statistics: 'Estadísticas',
        siteSettings: 'Configuración del Sitio',
        accessDenied: 'Acceso Denegado',
        adminArea: 'Área de Admin',
      },
      navigation: {
        tasks: 'Mis Tareas',
        assignedTasks: 'Tareas Asignadas',
        publicTasks: 'Tareas Públicas',
        calendar: 'Calendario',
        messenger: 'Mensajes',
        aiTools: 'Asistente IA',
        profile: 'Perfil',
        settings: 'Configuración',
        help: 'Ayuda',
        apiDocs: 'Documentación API',
        back: 'Atrás',
        openMenu: 'Abrir Menú',
        closeMenu: 'Cerrar Menú',
        menu: 'Menú',
        mainNavigation: 'Navegación Principal',
        sideNavigation: 'Navegación Lateral',
        bottomNavigation: 'Navegación Inferior',
        marketplace: 'Mercado',
      },
      tasks: {
        task: 'Tarea',
        tasks: 'Tareas',
        newTask: 'Nueva Tarea',
        completedTasks: 'Tareas Completadas',
        myTasks: 'Mis Tareas',
        assignedTasks: 'Tareas Asignadas',
        taskDetails: 'Detalles de la Tarea',
        taskTitle: 'Título de la Tarea',
        taskDescription: 'Descripción',
        dueDate: 'Fecha de Vencimiento',
        priorityLabel: 'Prioridad',
        statusLabel: 'Estado',
        assignedTo: 'Asignado a',
        createdBy: 'Creado por',
        attachments: 'Archivos Adjuntos',
        labels: 'Etiquetas',
        addLabel: 'Añadir Etiqueta',
        createTask: 'Crear Tarea',
        editTask: 'Editar Tarea',
        deleteTask: 'Eliminar Tarea',
        completeTask: 'Completar Tarea',
        templates: 'Plantillas',
        bidAmount: 'Monto de la Oferta',
        bidDetails: 'Detalles de la Oferta',
        submitBid: 'Enviar Oferta',
        cancelBid: 'Cancelar Oferta',
        acceptBid: 'Aceptar Oferta',
        rejectBid: 'Rechazar Oferta',
        bidStatus: 'Estado de la Oferta',
        pendingBids: 'Ofertas Pendientes',
        acceptedBids: 'Ofertas Aceptadas',
        rejectedBids: 'Ofertas Rechazadas',
        shareTask: 'Compartir Tarea',
        makePulic: 'Hacer Pública',
        makePrivate: 'Hacer Privada',
        priority: {
          high: 'Alta',
          medium: 'Media',
          low: 'Baja',
        },
        status: {
          todo: 'Por Hacer',
          inProgress: 'En Progreso',
          completed: 'Completada',
          cancelled: 'Cancelada',
          delegated: 'Delegada',
        }
      },
      calendar: {
        today: 'Hoy',
        day: 'Día',
        week: 'Semana',
        month: 'Mes',
        events: 'Eventos',
        newEvent: 'Nuevo Evento',
        eventDetails: 'Detalles del Evento',
        allDay: 'Todo el Día',
        startDate: 'Fecha de Inicio',
        endDate: 'Fecha de Fin',
        startTime: 'Hora de Inicio',
        endTime: 'Hora de Fin',
        location: 'Ubicación',
        participants: 'Participantes',
        reminder: 'Recordatorio',
        addReminder: 'Añadir Recordatorio',
        reminderTime: 'Hora del Recordatorio',
        reminderType: 'Tipo de Recordatorio',
      },
      messages: {
        messages: 'Mensajes',
        newMessage: 'Nuevo Mensaje',
        sendMessage: 'Enviar Mensaje',
        typeMessage: 'Escribe un mensaje...',
        searchMessages: 'Buscar Mensajes',
        noMessages: 'No hay Mensajes',
        noConversations: 'No hay Conversaciones',
        startConversation: 'Iniciar una Conversación',
        directMessage: 'Mensaje Directo',
        searchUsers: 'Buscar Usuarios',
        online: 'En Línea',
        offline: 'Desconectado',
        typing: 'escribiendo...',
        delivered: 'Entregado',
        seen: 'Visto',
        unseen: 'No Visto',
        reactions: 'Reacciones',
        addReaction: 'Añadir Reacción',
        deleteMessage: 'Eliminar Mensaje',
        editMessage: 'Editar Mensaje',
      },
      profile: {
        myProfile: 'Mi Perfil',
        editProfile: 'Editar Perfil',
        username: 'Nombre de Usuario',
        email: 'Correo Electrónico',
        fullName: 'Nombre Completo',
        firstName: 'Nombre',
        lastName: 'Apellido',
        phoneNumber: 'Número de Teléfono',
        bio: 'Biografía',
        location: 'Ubicación',
        website: 'Sitio Web',
        company: 'Empresa',
        position: 'Cargo',
        skills: 'Habilidades',
        interests: 'Intereses',
        education: 'Educación',
        experience: 'Experiencia',
        languages: 'Idiomas',
        socialMedia: 'Redes Sociales',
        settings: 'Configuración',
        notifications: 'Notificaciones',
        darkMode: 'Modo Oscuro',
        privacy: 'Privacidad',
        security: 'Seguridad',
        taskStatistics: 'Estadísticas de Tareas',
        completedTasks: 'Tareas Completadas',
        pendingTasks: 'Tareas Pendientes',
        delegatedTasks: 'Tareas Delegadas',
        taskCompletion: 'Finalización de Tareas',
      },
      ai: {
        aiAssistant: 'Asistente IA',
        aiTools: 'Herramientas IA',
        askAI: 'Preguntar a IA',
        generateWithAI: 'Generar con IA',
        promptForAI: '¿En qué puedo ayudarte?',
        promptPlaceholder: 'Pregúntame cualquier cosa sobre tus tareas o productividad...',
        thinking: 'Pensando...',
        generating: 'Generando...',
        taskSuggestions: 'Sugerencias de Tareas',
        taskOptimization: 'Optimización de Tareas',
        dailySchedule: 'Horario Diario',
        taskDelegation: 'Delegación de Tareas',
        imageGeneration: 'Generación de Imágenes',
        codeGeneration: 'Generación de Código',
        contentGeneration: 'Generación de Contenido',
        models: 'Modelos',
        openai: 'OpenAI GPT-4o',
        anthropic: 'Anthropic Claude',
      },
      api: {
        apiDocumentation: 'Documentación API',
        apiKeys: 'Claves API',
        createApiKey: 'Crear Clave API',
        revokeApiKey: 'Revocar Clave API',
        apiKeyName: 'Nombre de la Clave API',
        apiKeyCreated: 'Clave API Creada',
        apiKeyRevoked: 'Clave API Revocada',
        endpoints: 'Endpoints',
        parameters: 'Parámetros',
        responses: 'Respuestas',
        authentication: 'Autenticación',
        examples: 'Ejemplos',
        errorCodes: 'Códigos de Error',
        rateLimit: 'Límite de Velocidad',
        version: 'Versión',
      },
      error: {
        notFound: 'Página No Encontrada',
        serverError: 'Error del Servidor',
        unauthorized: 'No Autorizado',
        forbidden: 'Prohibido',
        badRequest: 'Solicitud Incorrecta',
        networkError: 'Error de Red',
        unknownError: 'Error Desconocido',
        tryAgain: 'Por favor, inténtalo de nuevo',
        goBack: 'Volver',
        contactSupport: 'Contactar Soporte',
        pageNotFoundMessage: 'Es posible que la página que estás buscando haya sido eliminada, haya cambiado de nombre o no esté disponible temporalmente.',
        requestedUrl: 'URL Solicitada'
      }
    }
  },
  fr: {
    translation: {
      common: {
        appName: 'Appmo',
        appMenu: 'Menu Appmo',
        language: 'Langue',
        region: 'Région',
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        create: 'Créer',
        search: 'Rechercher',
        settings: 'Paramètres',
        help: 'Aide',
        about: 'À propos',
        back: 'Retour',
        next: 'Suivant',
        confirm: 'Confirmer',
        close: 'Fermer',
        done: 'Terminé',
        apply: 'Appliquer',
        reset: 'Réinitialiser',
        notFound: 'Non Trouvé',
        welcome: 'Bienvenue',
        logout: 'Déconnexion',
      },
      auth: {
        login: 'Connexion',
        logout: 'Déconnexion',
        signUp: "S'inscrire",
        signIn: 'Se Connecter',
        createAccount: 'Créer un Compte',
        forgotPassword: 'Mot de Passe Oublié',
        resetPassword: 'Réinitialiser le Mot de Passe',
        email: 'Email',
        password: 'Mot de Passe',
        confirmPassword: 'Confirmer le Mot de Passe',
        username: "Nom d'Utilisateur",
        rememberMe: 'Se Souvenir de Moi',
        continueWith: 'Continuer avec',
        orSignInWith: 'Ou se connecter avec',
        orSignUpWith: "Ou s'inscrire avec",
        alreadyHaveAccount: 'Vous avez déjà un compte?',
        dontHaveAccount: "Vous n'avez pas de compte?",
        socialAuth: {
          google: 'Google',
          facebook: 'Facebook',
          twitter: 'Twitter',
          github: 'GitHub',
        }
      },
      admin: {
        login: 'Connexion Admin',
        dashboard: 'Tableau de Bord Admin',
        userManagement: 'Gestion des Utilisateurs',
        blogManagement: 'Gestion du Blog',
        statistics: 'Statistiques',
        siteSettings: 'Paramètres du Site',
        accessDenied: 'Accès Refusé',
        adminArea: 'Espace Admin',
      },
      navigation: {
        tasks: 'Mes Tâches',
        assignedTasks: 'Tâches Assignées',
        publicTasks: 'Tâches Publiques',
        calendar: 'Calendrier',
        messenger: 'Messages',
        aiTools: 'Assistant IA',
        profile: 'Profil',
        settings: 'Paramètres',
        help: 'Aide',
        apiDocs: 'Documentation API',
        back: 'Retour',
        openMenu: 'Ouvrir Menu',
        closeMenu: 'Fermer Menu',
        menu: 'Menu',
        mainNavigation: 'Navigation Principale',
        sideNavigation: 'Navigation Latérale',
        bottomNavigation: 'Navigation Inférieure',
        marketplace: 'Marché',
      },
      tasks: {
        task: 'Tâche',
        tasks: 'Tâches',
        newTask: 'Nouvelle Tâche',
        completedTasks: 'Tâches Terminées',
        myTasks: 'Mes Tâches',
        assignedTasks: 'Tâches Assignées',
        taskDetails: 'Détails de la Tâche',
        taskTitle: 'Titre de la Tâche',
        taskDescription: 'Description',
        dueDate: "Date d'Échéance",
        priorityLabel: 'Priorité',
        statusLabel: 'Statut',
        assignedTo: 'Assigné à',
        createdBy: 'Créé par',
        attachments: 'Pièces Jointes',
        labels: 'Étiquettes',
        addLabel: 'Ajouter une Étiquette',
        createTask: 'Créer une Tâche',
        editTask: 'Modifier la Tâche',
        deleteTask: 'Supprimer la Tâche',
        completeTask: 'Terminer la Tâche',
        templates: 'Modèles',
        bidAmount: "Montant de l'Offre",
        bidDetails: "Détails de l'Offre",
        submitBid: "Soumettre l'Offre",
        cancelBid: "Annuler l'Offre",
        acceptBid: "Accepter l'Offre",
        rejectBid: "Rejeter l'Offre",
        bidStatus: "Statut de l'Offre",
        pendingBids: 'Offres en Attente',
        acceptedBids: 'Offres Acceptées',
        rejectedBids: 'Offres Rejetées',
        shareTask: 'Partager la Tâche',
        makePulic: 'Rendre Publique',
        makePrivate: 'Rendre Privée',
        priority: {
          high: 'Haute',
          medium: 'Moyenne',
          low: 'Basse',
        },
        status: {
          todo: 'À Faire',
          inProgress: 'En Cours',
          completed: 'Terminée',
          cancelled: 'Annulée',
          delegated: 'Déléguée',
        }
      },
      calendar: {
        today: "Aujourd'hui",
        day: 'Jour',
        week: 'Semaine',
        month: 'Mois',
        events: 'Événements',
        newEvent: 'Nouvel Événement',
        eventDetails: "Détails de l'Événement",
        allDay: 'Toute la Journée',
        startDate: 'Date de Début',
        endDate: 'Date de Fin',
        startTime: 'Heure de Début',
        endTime: 'Heure de Fin',
        location: 'Lieu',
        participants: 'Participants',
        reminder: 'Rappel',
        addReminder: 'Ajouter un Rappel',
        reminderTime: 'Heure du Rappel',
        reminderType: 'Type de Rappel',
      },
      messages: {
        messages: 'Messages',
        newMessage: 'Nouveau Message',
        sendMessage: 'Envoyer un Message',
        typeMessage: 'Tapez un message...',
        searchMessages: 'Rechercher des Messages',
        noMessages: 'Pas de Messages',
        noConversations: 'Pas de Conversations',
        startConversation: 'Démarrer une Conversation',
        directMessage: 'Message Direct',
        searchUsers: 'Rechercher des Utilisateurs',
        online: 'En Ligne',
        offline: 'Hors Ligne',
        typing: 'en train de taper...',
        delivered: 'Livré',
        seen: 'Vu',
        unseen: 'Non Vu',
        reactions: 'Réactions',
        addReaction: 'Ajouter une Réaction',
        deleteMessage: 'Supprimer le Message',
        editMessage: 'Modifier le Message',
      },
      profile: {
        myProfile: 'Mon Profil',
        editProfile: 'Modifier le Profil',
        username: "Nom d'Utilisateur",
        email: 'Email',
        fullName: 'Nom Complet',
        firstName: 'Prénom',
        lastName: 'Nom',
        phoneNumber: 'Numéro de Téléphone',
        bio: 'Biographie',
        location: 'Lieu',
        website: 'Site Web',
        company: 'Entreprise',
        position: 'Poste',
        skills: 'Compétences',
        interests: 'Intérêts',
        education: 'Éducation',
        experience: 'Expérience',
        languages: 'Langues',
        socialMedia: 'Réseaux Sociaux',
        settings: 'Paramètres',
        notifications: 'Notifications',
        darkMode: 'Mode Sombre',
        privacy: 'Confidentialité',
        security: 'Sécurité',
        taskStatistics: 'Statistiques des Tâches',
        completedTasks: 'Tâches Terminées',
        pendingTasks: 'Tâches en Attente',
        delegatedTasks: 'Tâches Déléguées',
        taskCompletion: 'Achèvement des Tâches',
      },
      ai: {
        aiAssistant: 'Assistant IA',
        aiTools: 'Outils IA',
        askAI: 'Demander à l\'IA',
        generateWithAI: 'Générer avec l\'IA',
        promptForAI: 'Comment puis-je vous aider?',
        promptPlaceholder: 'Demandez-moi n\'importe quoi sur vos tâches ou votre productivité...',
        thinking: 'Réflexion en cours...',
        generating: 'Génération en cours...',
        taskSuggestions: 'Suggestions de Tâches',
        taskOptimization: 'Optimisation des Tâches',
        dailySchedule: 'Programme Quotidien',
        taskDelegation: 'Délégation de Tâches',
        imageGeneration: 'd\'Images',
        codeGeneration: 'Génération de Code',
        contentGeneration: 'Génération de Contenu',
        models: 'Modèles',
        openai: 'OpenAI GPT-4o',
        anthropic: 'Anthropic Claude',
      },
      api: {
        apiDocumentation: 'Documentation API',
        apiKeys: 'Clés API',
        createApiKey: 'Créer une Clé API',
        revokeApiKey: 'Révoquer la Clé API',
        apiKeyName: 'Nom de la Clé API',
        apiKeyCreated: 'Clé API Créée',
        apiKeyRevoked: 'Clé API Révoquée',
        endpoints: 'Endpoints',
        parameters: 'Paramètres',
        responses: 'Réponses',
        authentication: 'Authentification',
        examples: 'Exemples',
        errorCodes: "Codes d'Erreur",
        rateLimit: 'Limite de Taux',
        version: 'Version',
      },
      error: {
        notFound: 'Page Non Trouvée',
        serverError: 'Erreur du Serveur',
        unauthorized: 'Non Autorisé',
        forbidden: 'Interdit',
        badRequest: 'Mauvaise Requête',
        networkError: 'Erreur de Réseau',
        unknownError: 'Erreur Inconnue',
        tryAgain: 'Veuillez réessayer',
        goBack: 'Retour',
        contactSupport: 'Contacter le Support',
        pageNotFoundMessage: 'La page que vous recherchez a peut-être été supprimée, a changé de nom ou est temporairement indisponible.',
        requestedUrl: 'URL Demandée'
      }
    }
  }
};

// List of available languages
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'sv', name: 'Svenska' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' },
  { code: 'he', name: 'עברית' },
];

// List of available regions
export const getAvailableRegions = () => [
  // North America
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  
  // South America
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'VE', name: 'Venezuela' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'PL', name: 'Poland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'RU', name: 'Russia' },
  
  // Asia
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  
  // Middle East
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IL', name: 'Israel' },
  { code: 'TR', name: 'Turkey' },
  { code: 'EG', name: 'Egypt' },
  
  // Oceania
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
];

// Map country codes to language codes
const countryToLanguageMap: Record<string, string> = {
  // English
  US: 'en', // United States
  GB: 'en', // United Kingdom
  CA: 'en', // Canada (could be fr based on region)
  AU: 'en', // Australia
  NZ: 'en', // New Zealand
  IE: 'en', // Ireland
  ZA: 'en', // South Africa
  
  // Spanish
  ES: 'es', // Spain
  MX: 'es', // Mexico
  AR: 'es', // Argentina
  CL: 'es', // Chile
  CO: 'es', // Colombia
  PE: 'es', // Peru
  VE: 'es', // Venezuela
  
  // French
  FR: 'fr', // France
  BE: 'fr', // Belgium (could be nl based on region)
  CH: 'fr', // Switzerland (could be de, it based on region)
  CA_QC: 'fr', // Quebec, Canada
  
  // German
  DE: 'de', // Germany
  AT: 'de', // Austria
  CH_DE: 'de', // German-speaking Switzerland
  
  // Italian
  IT: 'it', // Italy
  CH_IT: 'it', // Italian-speaking Switzerland
  SM: 'it', // San Marino
  
  // Portuguese
  PT: 'pt', // Portugal
  BR: 'pt', // Brazil
  AO: 'pt', // Angola
  MZ: 'pt', // Mozambique
  
  // Russian
  RU: 'ru', // Russia
  BY: 'ru', // Belarus
  KZ: 'ru', // Kazakhstan
  
  // Chinese
  CN: 'zh', // China
  TW: 'zh', // Taiwan
  HK: 'zh', // Hong Kong
  SG: 'zh', // Singapore (Chinese population)
  
  // Japanese
  JP: 'ja', // Japan
  
  // Korean
  KR: 'ko', // South Korea
  
  // Arabic
  SA: 'ar', // Saudi Arabia
  AE: 'ar', // UAE
  EG: 'ar', // Egypt
  JO: 'ar', // Jordan
  LB: 'ar', // Lebanon
  
  // Hindi
  IN: 'hi', // India
  
  // Indonesian
  ID: 'id', // Indonesia
  
  // Turkish
  TR: 'tr', // Turkey
  
  // Dutch
  NL: 'nl', // Netherlands
  BE_NL: 'nl', // Dutch-speaking Belgium (Flanders)
  
  // Polish
  PL: 'pl', // Poland
  
  // Swedish
  SE: 'sv', // Sweden
  FI_SV: 'sv', // Swedish-speaking Finland
  
  // Vietnamese
  VN: 'vi', // Vietnam
  
  // Thai
  TH: 'th', // Thailand
  
  // Hebrew
  IL: 'he', // Israel
};

// Function to get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

// Function to set language based on country code
export const setLanguageByCountry = (countryCode: string): string => {
  const languageCode = countryToLanguageMap[countryCode] || 'en';
  
  if (i18n.languages.includes(languageCode)) {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('i18nextLng', languageCode);
  }
  
  return languageCode;
};

// Function to force reload if language has changed
const checkForLanguageChange = () => {
  // Get saved language from localStorage
  const savedLanguage = localStorage.getItem('i18nextLng');
  
  if (savedLanguage) {
    console.log(`Detected language from localStorage: ${savedLanguage}`);
  }
  
  // Listen for language changes
  i18n.on('languageChanged', (lng) => {
    console.log(`Language changed event: ${lng}`);
  });
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  }, (err, t) => {
    if (err) {
      console.error('i18next initialization error:', err);
    } else {
      console.log(`i18next initialized with language: ${i18n.language}`);
      checkForLanguageChange();
    }
  });

export default i18n;