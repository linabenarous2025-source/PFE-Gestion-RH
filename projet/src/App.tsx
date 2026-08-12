// Importation du hook useState pour gérer les états locaux du composant
import { useState, useEffect } from "react";
// Importation de motion (pour les animations) et AnimatePresence (pour animer les montages/démontages) depuis framer-motion
import { motion, AnimatePresence } from "framer-motion";
// Importation de la barre de navigation du manager
import { Navigation } from "./components/Navigation";
// Importation de la barre de navigation de l'employé
import { EmployeeNavigation } from "./components/EmployeeNavigation";
// Importation de la page de connexion
import { LoginPage } from "./pages/LoginPage";
// Importation de la page de configuration initiale (premier lancement)
import { SetupPage } from "./pages/SetupPage";
// Importation de la page de liste des employés (vue manager)
import { EmployeesPage } from "./pages/EmployeesPage";
// Importation de la page de détail d'un employé (vue manager)
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
// Importation de la page de gestion des formations (vue manager)
import { FormationsPage } from "./pages/FormationsPage";
// Importation du tableau de bord (vue manager)
import { DashboardPage } from "./pages/DashboardPage";
// Importation de la page de gestion des demandes (vue manager)
import { ManagerRequestsPage } from "./pages/ManagerRequestsPage";
// Importation de la page des formations disponibles (vue employé)
import { EmployeeFormationsPage } from "./pages/employee/EmployeeFormationsPage";
// Importation de la page d'historique des formations suivies (vue employé)
import { EmployeeHistoryPage } from "./pages/employee/EmployeeHistoryPage";
// Importation de la page des demandes de formation (vue employé)
import { EmployeeRequestsPage } from "./pages/employee/EmployeeRequestsPage";
// Importation de la page de profil (vue employé)
import { EmployeeProfilePage } from "./pages/employee/EmployeeProfilePage";
// Importation du modal de formulaire pour ajouter/modifier un employé
import { EmployeeFormModal } from "./components/EmployeeFormModal";
// Importation du modal de formulaire pour ajouter/modifier une formation
import { FormationFormModal } from "./components/FormationFormModal";
// Importation du modal de confirmation de suppression
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
// Importation des types TypeScript : Employee, Formation et FormationRequest
import type { Employee, Formation, FormationRequest } from "./types/types";

// Type union représentant les pages accessibles par le manager
type ManagerPage = "employees" | "formations" | "dashboard" | "requests";
// Type union représentant les pages accessibles par l'employé
type EmployeePage = "formations" | "historique" | "demandes" | "profil";

// Objet de configuration de la transition de page utilisé par framer-motion
const pageTransition = {
  initial: { opacity: 0, y: 12 },       // État initial : invisible et décalé vers le bas de 12px
  animate: { opacity: 1, y: 0 },         // État final : visible et à sa position naturelle
  exit: { opacity: 0, y: -8 },           // Sortie : disparaît en remontant de 8px
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }, // Durée 300ms avec easing personnalisé
};

// Fonction utilitaire qui retourne les en-têtes HTTP avec le token JWT stocké dans localStorage
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// Déclaration du composant principal de l'application
export function App() {
  // ── Auth ──────────────────────────────────────────────────────
  // État indiquant si la configuration initiale est nécessaire (null = en cours de vérification)
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  // État indiquant si l'utilisateur est connecté
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Rôle de l'utilisateur connecté : "manager" ou "employee"
  const [userRole, setUserRole] = useState<"manager" | "employee">("manager");
  // Données de l'employé connecté (null si c'est un manager ou si personne n'est connecté)
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // ── Navigation ────────────────────────────────────────────────
  // Page active dans la vue manager
  const [activeManagerPage, setActiveManagerPage] =
    useState<ManagerPage>("dashboard");
  // Page active dans la vue employé
  const [activeEmployeePage, setActiveEmployeePage] =
    useState<EmployeePage>("formations");
  // Matricule de l'employé dont on affiche le détail (null si aucun sélectionné)
  const [selectedEmployeeMatricule, setSelectedEmployeeMatricule] = useState<
    string | null
  >(null);

  // ── Data ──────────────────────────────────────────────────────
  // Liste de tous les employés chargés depuis l'API
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  // Liste de toutes les formations chargées depuis l'API
  const [formationList, setFormationList] = useState<Formation[]>([]);
  // Liste de toutes les demandes de formation chargées depuis l'API
  const [requestList, setRequestList] = useState<FormationRequest[]>([]);

  // ── Modals Manager ────────────────────────────────────────────
  // Contrôle l'ouverture du modal de formulaire employé
  const [isEmpFormOpen, setIsEmpFormOpen] = useState(false);
  // Employé en cours d'édition (null si c'est une création)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  // Contrôle l'ouverture du modal de suppression d'employé
  const [isEmpDeleteOpen, setIsEmpDeleteOpen] = useState(false);
  // Employé ciblé par la suppression
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null,
  );
  // Contrôle l'ouverture du modal de formulaire formation
  const [isFormFormOpen, setIsFormFormOpen] = useState(false);
  // Formation en cours d'édition (null si c'est une création)
  const [editingFormation, setEditingFormation] = useState<Formation | null>(
    null,
  );
  // Contrôle l'ouverture du modal de suppression de formation
  const [isFormDeleteOpen, setIsFormDeleteOpen] = useState(false);
  // Formation ciblée par la suppression
  const [deletingFormation, setDeletingFormation] = useState<Formation | null>(
    null,
  );

  // ── Modals Employee ───────────────────────────────────────────
  // Contrôle l'ouverture du modal d'édition du profil employé
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  // ── Init ──────────────────────────────────────────────────────
  // Effect exécuté une seule fois au montage du composant
  useEffect(() => {
    // Appel API pour vérifier si la configuration initiale a été faite
    fetch("http://localhost/PFE/php/auth_check_setup.php")
      .then((r) => r.json())
      .then((d) => setNeedsSetup(d.needsSetup)) // Met à jour l'état selon la réponse
      .catch(() => setNeedsSetup(false));        // En cas d'erreur réseau, on suppose que le setup est fait

    // Tentative de restauration de la session depuis localStorage
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as "manager" | "employee" | null;
    const emp = localStorage.getItem("employee");
    // Si un token et un rôle existent, on restaure la session
    if (token && role) {
      setUserRole(role);
      setIsLoggedIn(true);
      // Si l'utilisateur est un employé, on restaure ses données
      if (role === "employee" && emp) {
        setCurrentEmployee(JSON.parse(emp));
      }
    }
  }, []); // Tableau de dépendances vide = exécution uniquement au montage

  // Effect déclenché chaque fois que isLoggedIn change
  useEffect(() => {
  // Si l'utilisateur est connecté et qu'un token est présent, on charge toutes les données
  if (isLoggedIn && localStorage.getItem("token")) {
    loadEmployees();
    loadFormations();
    loadRequests();
  }
}, [isLoggedIn]); // Dépendance : se relance si isLoggedIn change

  // ── Loaders ───────────────────────────────────────────────────
  // Fonction asynchrone pour charger la liste des employés depuis l'API
  const loadEmployees = async () => {
    try {
      // Requête GET avec authentification
      const res = await fetch("http://localhost/PFE/php/employee_read.php", {
        headers: authHeaders(),
      });
      const data = await res.json();
      // Mise à jour de la liste selon le format de réponse (objet avec clé "employees" ou tableau direct)
      if (data.employees) setEmployeeList(data.employees);
      else if (Array.isArray(data)) setEmployeeList(data);
    } catch (e) {
      console.error("Error loading employees:", e);
    }
  };

  // Fonction asynchrone pour charger la liste des formations depuis l'API
  const loadFormations = async () => {
    try {
      const res = await fetch("http://localhost/PFE/php/formation_read.php", {
        headers: authHeaders(),
      });
      const data = await res.json();
      // Mise à jour de la liste selon le format de réponse
      if (data.formations) setFormationList(data.formations);
      else if (Array.isArray(data)) setFormationList(data);
    } catch (e) {
      console.error("Error loading formations:", e);
    }
  };

  // Fonction asynchrone pour charger la liste des demandes depuis l'API
  const loadRequests = async () => {
    try {
      const res = await fetch("http://localhost/PFE/php/request_read.php", {
        headers: authHeaders(),
      });
      const data = await res.json();
      // Mise à jour de la liste selon le format de réponse
      if (data.requests) setRequestList(data.requests);
      else if (Array.isArray(data)) setRequestList(data);
    } catch (e) {
      console.error("Error loading requests:", e);
    }
  };

  // ── Auth handlers ─────────────────────────────────────────────
  // Callback appelé par LoginPage après une connexion réussie
  const handleLogin = (role: "manager" | "employee", employeeId?: string) => {
    setUserRole(role);         // On enregistre le rôle
    setIsLoggedIn(true);       // On passe l'app en mode connecté
    setActiveManagerPage("dashboard");   // On remet le manager sur le dashboard
    setActiveEmployeePage("formations"); // On remet l'employé sur les formations
    if (role === "employee") {
      // Pour un employé, on récupère ses données depuis localStorage (stockées par LoginPage)
      const emp = localStorage.getItem("employee");
      if (emp) setCurrentEmployee(JSON.parse(emp));
    }
  };

  // Callback appelé pour déconnecter l'utilisateur
  const handleLogout = () => {
    // Suppression de toutes les données de session du localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("employee");
    // Réinitialisation de tous les états
    setIsLoggedIn(false);
    setUserRole("manager");
    setCurrentEmployee(null);
    setSelectedEmployeeMatricule(null);
    setEmployeeList([]);
    setFormationList([]);
    setRequestList([]);
  };

  // ── Navigation handlers ───────────────────────────────────────
  // Callback de navigation pour le manager, réinitialise aussi la sélection d'employé
  const handleManagerNavigate = (page: string) => {
    setActiveManagerPage(page as ManagerPage);
    setSelectedEmployeeMatricule(null); // On ferme le détail employé si on change de page
  };
  // Callback de navigation pour l'employé
  const handleEmployeeNavigate = (page: string) =>
    setActiveEmployeePage(page as EmployeePage);

  // ── Employee CRUD ─────────────────────────────────────────────
  // Sélectionne un employé pour afficher son détail
  const handleSelectEmployee = (matricule: string) =>
    setSelectedEmployeeMatricule(matricule);
  // Revient à la liste des employés depuis le détail
  const handleBackToEmployees = () => setSelectedEmployeeMatricule(null);
  // Ouvre le modal de création d'employé (editingEmployee à null = mode création)
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setIsEmpFormOpen(true);
  };
  // Ouvre le modal d'édition d'un employé existant
  const handleOpenEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEmpFormOpen(true);
  };
  // Ouvre le modal de confirmation de suppression d'un employé
  const handleOpenDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee);
    setIsEmpDeleteOpen(true);
  };

  // Fonction asynchrone pour créer ou mettre à jour un employé via l'API
  const handleSaveEmployee = async (data: Omit<Employee, "photoUrl">) => {
  try {
    // On détermine si c'est une mise à jour ou une création
    const isUpdate = !!editingEmployee;
    // Appel API avec toutes les données + le flag isUpdate
    const res = await fetch("http://localhost/PFE/php/employee_save.php", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...data, isUpdate }),
    });
    const result = await res.json();

    // Si l'API retourne une erreur, on lève une exception
    if (!result.success) throw new Error(result.error || "Save failed");

    // On préfère les données retournées par l'API, sinon on utilise celles du formulaire
    const employeeData = result.employee ?? data;
    // Construction de l'objet employé complet avec un avatar généré automatiquement
    const saved: Employee = {
      ...employeeData,
      photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.firstName)}+${encodeURIComponent(employeeData.lastName)}&background=1D4ED8&color=fff&size=128`,
    };

    // Mise à jour de la liste : remplacement si édition, ajout si création
    setEmployeeList((prev) =>
      isUpdate
        ? prev.map((e) => (e.matricule === saved.matricule ? saved : e))
        : [...prev, saved],
    );
    // Fermeture du modal et réinitialisation
    setIsEmpFormOpen(false);
    setEditingEmployee(null);
  } catch (e) {
    console.error(e);
    alert("Erreur lors de la sauvegarde");
  }
};

  // Fonction asynchrone pour mettre à jour uniquement le profil de l'employé connecté
  async function handleSaveEmployeeProfil(data: Omit<Employee, "photoUrl">) {
    try {
      // Appel API avec isUpdate forcé à true (toujours une modification de profil)
      const res = await fetch("http://localhost/PFE/php/employee_save.php", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...data, isUpdate: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Update failed");

      // Fusion des données existantes avec les nouvelles pour ne perdre aucun champ
      const updated: Employee = {
        ...currentEmployee!, // On conserve toutes les données actuelles (! = assertion non-null)
        ...data,             // On écrase avec les nouvelles données
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName)}+${encodeURIComponent(data.lastName)}&background=1D4ED8&color=fff&size=128`,
      };

      // Mise à jour de l'état et du localStorage pour persister les changements
      setCurrentEmployee(updated);
      localStorage.setItem("employee", JSON.stringify(updated));
      setIsProfileEditOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour du profil");
    }
  }

  // Fonction asynchrone pour supprimer un employé via l'API
  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return; // Sécurité : on ne fait rien si aucun employé ciblé
    try {
      const res = await fetch("http://localhost/PFE/php/employee_delete.php", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ matricule: deletingEmployee.matricule }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      // Suppression de l'employé de la liste locale
      setEmployeeList((prev) =>
        prev.filter((e) => e.matricule !== deletingEmployee.matricule),
      );
      // Si on était sur le détail de cet employé, on revient à la liste
      if (selectedEmployeeMatricule === deletingEmployee.matricule)
        setSelectedEmployeeMatricule(null);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression");
    } finally {
      // Dans tous les cas (succès ou erreur), on ferme le modal et réinitialise
      setDeletingEmployee(null);
      setIsEmpDeleteOpen(false);
    }
  };

  // ── Formation CRUD ────────────────────────────────────────────
  // Ouvre le modal de création de formation
  const handleOpenAddFormation = () => {
    setEditingFormation(null);
    setIsFormFormOpen(true);
  };
  // Ouvre le modal d'édition d'une formation existante
  const handleOpenEditFormation = (f: Formation) => {
    setEditingFormation(f);
    setIsFormFormOpen(true);
  };
  // Ouvre le modal de confirmation de suppression d'une formation
  const handleOpenDeleteFormation = (f: Formation) => {
    setDeletingFormation(f);
    setIsFormDeleteOpen(true);
  };

  // Fonction asynchrone pour créer ou mettre à jour une formation via l'API
  const handleSaveFormation = async (data: Omit<Formation, "created_at">) => {
    try {
      const res = await fetch("http://localhost/PFE/php/formation_save.php", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...data, isUpdate: !!editingFormation }), // isUpdate vrai si on édite
      });
      const result = await res.json();
      console.log("Formation save result:", result); // Log de débogage pour vérifier la réponse
      // Si l'API retourne des erreurs (tableau d'erreurs de validation ou message unique), on les affiche
      if (!result.success)
        throw new Error(JSON.stringify(result.errors || result.error));
      // Rechargement complet de la liste des formations depuis l'API
      await loadFormations();
      setIsFormFormOpen(false);
      setEditingFormation(null);
    } catch (e) {
      console.error(e);
      alert("Erreur: " + e);
    }
  };

  // Fonction asynchrone pour supprimer une formation via l'API
  const handleDeleteFormation = async () => {
    if (!deletingFormation) return; // Sécurité : on ne fait rien si aucune formation ciblée
    try {
      const res = await fetch("http://localhost/PFE/php/formation_delete.php", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          numero_formation: deletingFormation.numero_formation, // Identifiant de la formation à supprimer
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      // Suppression de la formation de la liste locale
      setFormationList((prev) =>
        prev.filter(
          (f) => f.numero_formation !== deletingFormation.numero_formation,
        ),
      );
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression");
    } finally {
      // Fermeture du modal dans tous les cas
      setDeletingFormation(null);
      setIsFormDeleteOpen(false);
    }
  };

  // ── Requests ──────────────────────────────────────────────────
  // Fonction asynchrone pour approuver une demande de formation
  const handleApproveRequest = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost/PFE/php/request_update_status.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id, status: "Approuvée" }), // On envoie le nouveau statut "Approuvée"
        },
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      // Mise à jour de la demande dans la liste locale avec les données retournées par l'API
      setRequestList((prev) =>
        prev.map((r) => (r.id === id ? result.request : r)),
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'approbation");
    }
  };

  // Fonction asynchrone pour refuser une demande de formation
  const handleRejectRequest = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost/PFE/php/request_update_status.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id, status: "Refusée" }), // On envoie le nouveau statut "Refusée"
        },
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      // Mise à jour de la demande dans la liste locale
      setRequestList((prev) =>
        prev.map((r) => (r.id === id ? result.request : r)),
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors du refus");
    }
  };

  // Fonction asynchrone générique pour changer le statut d'une demande (kanban)
  const handleMoveRequest = async (
    id: string,
    newStatus: FormationRequest["status"], // Le statut est typé depuis l'interface FormationRequest
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost/PFE/php/request_update_status.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id, status: newStatus }), // On envoie le nouveau statut dynamique
        },
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      // Mise à jour de la demande dans la liste locale
      setRequestList((prev) =>
        prev.map((r) => (r.id === id ? result.request : r)),
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors du déplacement");
    }
  };

  // Fonction asynchrone pour soumettre une nouvelle demande de formation (vue employé)
  const handleRequestFormation = async (
    data: Omit<
      FormationRequest,
      "id" | "employeeId" | "status" | "dateRequest" // Ces champs sont gérés côté serveur
    >,
  ) => {
    if (!currentEmployee) return; // Sécurité : l'employé doit être connecté
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost/PFE/php/request_save.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      // Ajout de la nouvelle demande en tête de liste
      setRequestList((prev) => [result.request, ...prev]);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la demande");
    }
  };

  // Fonction asynchrone pour modifier une demande existante (vue employé)
  const handleEditRequest = async (
    id: string, // Identifiant de la demande à modifier
    data: Omit<
      FormationRequest,
      "id" | "employeeId" | "status" | "dateRequest"
    >,
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost/PFE/php/request_save.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, id }), // On inclut l'id pour signaler une mise à jour
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      // Remplacement de la demande modifiée dans la liste locale
      setRequestList((prev) =>
        prev.map((r) => (r.id === id ? result.request : r)),
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification");
    }
  };

  // Fonction asynchrone pour supprimer une demande de formation (vue employé)
  const handleDeleteRequest = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost/PFE/php/request_delete.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      // Suppression de la demande de la liste locale
      setRequestList((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
    }
  };

  // ── Enroll ────────────────────────────────────────────────────
  // Fonction asynchrone pour inscrire l'employé connecté à une formation
  const handleEnroll = async (numero_formation: string) => {
    if (!currentEmployee) return; // Sécurité : l'employé doit être connecté
    try {
      await fetch("http://localhost/PFE/php/formation_enroll.php", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          numero_formation,
          matricule: currentEmployee.matricule, // Matricule de l'employé connecté
          action: "enroll",                      // Action = inscription
        }),
      });
      await loadFormations(); // Rechargement des formations pour mettre à jour les participants
    } catch (e) {
      console.error(e);
    }
  };

  // Fonction asynchrone pour désinscrire l'employé connecté d'une formation
  const handleUnenroll = async (numero_formation: string) => {
    if (!currentEmployee) return; // Sécurité : l'employé doit être connecté
    try {
      await fetch("http://localhost/PFE/php/formation_enroll.php", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          numero_formation,
          matricule: currentEmployee.matricule, // Matricule de l'employé connecté
          action: "unenroll",                    // Action = désinscription
        }),
      });
      await loadFormations(); // Rechargement des formations pour mettre à jour les participants
    } catch (e) {
      console.error(e);
    }
  };

  // ── Profile edit ──────────────────────────────────────────────
  // Ouvre le modal d'édition du profil en pré-remplissant avec les données de l'employé connecté
  const handleOpenProfileEdit = () => {
    setEditingEmployee(currentEmployee); // On pré-charge les données actuelles dans le formulaire
    setIsProfileEditOpen(true);
  };

  // ── Loading / Setup ───────────────────────────────────────────
  // Pendant la vérification du setup (needsSetup === null), on affiche un spinner de chargement
  if (needsSetup === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        {/* Spinner animé centré sur fond sombre */}
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Si la configuration initiale n'a pas encore été faite, on affiche la page de setup
  if (needsSetup) {
    return <SetupPage onSetupComplete={() => setNeedsSetup(false)} />;
  }

  // Si l'utilisateur n'est pas connecté, on affiche la page de connexion
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── Manager View ──────────────────────────────────────────────
  // Rendu de la vue manager (accessible uniquement si userRole === "manager")
  if (userRole === "manager") {
    // Fonction interne qui retourne le composant de page correspondant à la navigation active
    const renderManagerPage = () => {
      // Cas spécial : si on est sur la page employés ET qu'un employé est sélectionné, on affiche son détail
      if (activeManagerPage === "employees" && selectedEmployeeMatricule) {
        return (
          <motion.div key="employee-detail" {...pageTransition}>
            <EmployeeDetailPage
              employeeMatricule={selectedEmployeeMatricule}
              employees={employeeList}
              formations={formationList}
              onBack={handleBackToEmployees}
              onEdit={handleOpenEditEmployee}
              onDelete={handleOpenDeleteEmployee}
            />
          </motion.div>
        );
      }
      // Switch sur la page active pour rendre le bon composant
      switch (activeManagerPage) {
        case "employees":
          return (
            <motion.div key="employees" {...pageTransition}>
              <EmployeesPage
                employees={employeeList}
                onSelectEmployee={handleSelectEmployee}
                onAddEmployee={handleOpenAddEmployee}
                onEditEmployee={handleOpenEditEmployee}
                onDeleteEmployee={handleOpenDeleteEmployee}
              />
            </motion.div>
          );
        case "formations":
          return (
            <motion.div key="formations" {...pageTransition}>
              <FormationsPage
                formations={formationList}
                employees={employeeList}
                onAddFormation={handleOpenAddFormation}
                onEditFormation={handleOpenEditFormation}
                onDeleteFormation={handleOpenDeleteFormation}
              />
            </motion.div>
          );
        case "dashboard":
          return (
            <motion.div key="dashboard" {...pageTransition}>
              <DashboardPage
                employees={employeeList}
                formations={formationList}
                requests={requestList}
              />
            </motion.div>
          );
        case "requests":
          return (
            <motion.div key="requests" {...pageTransition}>
              <ManagerRequestsPage
                requests={requestList}
                employees={employeeList}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                onMoveRequest={handleMoveRequest}
              />
            </motion.div>
          );
        default:
          return null; // Cas par défaut : aucune page ne correspond
      }
    };

    return (
      <div className="min-h-screen w-full bg-slate-50">
        {/* Barre de navigation du manager avec le compteur de demandes en attente */}
        <Navigation
          activePage={activeManagerPage}
          onNavigate={handleManagerNavigate}
          onLogout={handleLogout}
          pendingRequestsCount={
            // On filtre les demandes avec statut "En attente" pour afficher le badge
            requestList.filter((r) => r.status === "En attente").length
          }
        />
        <main>
          {/* AnimatePresence permet d'animer la sortie du composant précédent avant d'afficher le nouveau */}
          <AnimatePresence mode="wait">{renderManagerPage()}</AnimatePresence>
        </main>

        {/* Modal de formulaire pour créer ou modifier un employé */}
        <EmployeeFormModal
          isOpen={isEmpFormOpen}
          onClose={() => {
            setIsEmpFormOpen(false);
            setEditingEmployee(null); // Nettoyage de l'état d'édition à la fermeture
          }}
          onSave={handleSaveEmployee}
          employee={editingEmployee} // null = création, sinon édition
        />

        {/* Modal de formulaire pour créer ou modifier une formation */}
        <FormationFormModal
          isOpen={isFormFormOpen}
          onClose={() => {
            setIsFormFormOpen(false);
            setEditingFormation(null); // Nettoyage de l'état d'édition à la fermeture
          }}
          onSave={handleSaveFormation}
          formation={editingFormation} // null = création, sinon édition
          employees={employeeList}     // Liste des employés pour les champs de sélection
        />

        {/* Modal de confirmation de suppression d'un employé */}
        <DeleteConfirmModal
          isOpen={isEmpDeleteOpen}
          onClose={() => {
            setIsEmpDeleteOpen(false);
            setDeletingEmployee(null);
          }}
          onConfirm={handleDeleteEmployee}
          // Affichage du nom complet de l'employé dans le message de confirmation
          itemName={
            deletingEmployee
              ? `${deletingEmployee.firstName} ${deletingEmployee.lastName}`
              : ""
          }
          itemType="employé"
        />

        {/* Modal de confirmation de suppression d'une formation */}
        <DeleteConfirmModal
          isOpen={isFormDeleteOpen}
          onClose={() => {
            setIsFormDeleteOpen(false);
            setDeletingFormation(null);
          }}
          onConfirm={handleDeleteFormation}
          itemName={deletingFormation ? deletingFormation.theme : ""} // Affichage du thème de la formation
          itemType="formation"
        />
      </div>
    );
  }

  // ── Employee View ─────────────────────────────────────────────
  // Rendu de la vue employé (accessible uniquement si userRole === "employee" et currentEmployee non null)
  if (userRole === "employee" && currentEmployee) {
    // Fonction interne qui retourne le composant de page correspondant à la navigation employé active
    const renderEmployeePage = () => {
      switch (activeEmployeePage) {
        case "formations":
          return (
            <motion.div key="emp-formations" {...pageTransition}>
              <EmployeeFormationsPage
                formations={formationList}
                employee={currentEmployee}
                employees={employeeList}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
              />
            </motion.div>
          );
        case "historique":
          return (
            <motion.div key="emp-history" {...pageTransition}>
              <EmployeeHistoryPage
                formations={formationList}
                employee={currentEmployee}
              />
            </motion.div>
          );
        case "demandes":
          return (
            <motion.div key="emp-requests" {...pageTransition}>
              <EmployeeRequestsPage
                // On filtre les demandes pour n'afficher que celles de l'employé connecté
                requests={requestList.filter(
                  (r) => r.matricule === currentEmployee.matricule,
                )}
                onRequest={handleRequestFormation}
                onEditRequest={handleEditRequest}
                onDeleteRequest={handleDeleteRequest}
              />
            </motion.div>
          );
        case "profil":
          return (
            <motion.div key="emp-profile" {...pageTransition}>
              <EmployeeProfilePage
                employee={currentEmployee}
                onEdit={handleOpenProfileEdit}
              />
            </motion.div>
          );
        default:
          return null; // Cas par défaut : aucune page ne correspond
      }
    };

    return (
      <div className="min-h-screen w-full bg-slate-50">
        {/* Barre de navigation de l'employé avec ses informations */}
        <EmployeeNavigation
          activePage={activeEmployeePage}
          onNavigate={handleEmployeeNavigate}
          onLogout={handleLogout}
          employee={currentEmployee}
        />
        <main>
          {/* AnimatePresence pour animer les transitions entre les pages employé */}
          <AnimatePresence mode="wait">{renderEmployeePage()}</AnimatePresence>
        </main>

        {/* Modal de formulaire pour modifier le profil de l'employé connecté */}
        <EmployeeFormModal
          isOpen={isProfileEditOpen}
          onClose={() => {
            setIsProfileEditOpen(false);
            setEditingEmployee(null); // Nettoyage à la fermeture
          }}
          onSave={handleSaveEmployeeProfil} // Handler spécifique pour la mise à jour du profil
          employee={editingEmployee}         // Données actuelles de l'employé pré-remplies
        />
      </div>
    );
  }

  // Si aucune condition ne correspond (cas théoriquement impossible), on ne rend rien
  return null;
}
