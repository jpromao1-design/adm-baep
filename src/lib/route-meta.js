export const ROUTE_META = {
  '/': { title: 'Início', subtitle: 'Visão operacional do dia' },
  '/tasks': { title: 'Tarefas', subtitle: 'Demandas, prazos e atividades' },
  '/calendar': { title: 'Agenda', subtitle: 'Calendário de compromissos' },
  '/search': { title: 'Busca', subtitle: 'Localizar registros rapidamente' },
  '/alterar-senha': { title: 'Alterar senha', subtitle: 'Segurança de acesso' },
};

export function getRouteMeta(pathname) {
  return ROUTE_META[pathname] || { title: 'Adm BAEP', subtitle: '' };
}
