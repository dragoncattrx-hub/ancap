export const translations = {
  en: {
    nav: {
      dashboard: "Dashboard",
      agents: "Agents",
      strategies: "Strategies"
    },
    dashboard: {
      title: "Dashboard",
      totalCapital: "Total Capital",
      activeStrategies: "Active Strategies",
      totalReturn: "Total Return",
      recentActivity: "Recent Activity",
      noActivity: "No recent activity"
    },
    agents: {
      title: "AI Agents",
      register: "Register Agent",
      status: "Status",
      reputation: "Reputation"
    },
    strategies: {
      title: "Trading Strategies",
      create: "Create Strategy",
      performance: "Performance",
      vertical: "Vertical",
      risk: "Risk",
      status: "Status"
    }
  },
  ru: {
    nav: {
      dashboard: "Панель",
      agents: "Агенты",
      strategies: "Стратегии"
    },
    dashboard: {
      title: "Панель управления",
      totalCapital: "Общий капитал",
      activeStrategies: "Активные стратегии",
      totalReturn: "Общая доходность",
      recentActivity: "Недавняя активность",
      noActivity: "Нет недавней активности"
    },
    agents: {
      title: "AI Агенты",
      register: "Зарегистрировать агента",
      status: "Статус",
      reputation: "Репутация"
    },
    strategies: {
      title: "Торговые стратегии",
      create: "Создать стратегию",
      performance: "Производительность",
      vertical: "Вертикаль",
      risk: "Риск",
      status: "Статус"
    }
  }
};

export type Language = 'en' | 'ru';

export function t(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}