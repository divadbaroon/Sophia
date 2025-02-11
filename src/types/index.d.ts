
// ====== DASHBOARD CREATE SESSION

export interface CreateSessionProps {
    onCancel: () => void
  }

// ====== DASHBOARD SEARCH

export interface SearchHeaderProps {
  title: string
  description: string
  showNewButton?: boolean
  onNewClick?: () => void
  filterOptions: {
    value: string
    label: string
  }[]
}

// ====== DASHBOARD CARD

export interface SessionCardProps {
  type: "active" | "upcoming" | "past"
  data: any
}

// ====== DASHBOARD SIDEBAR

export interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}