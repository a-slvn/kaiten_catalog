import { Column } from '../types';

export const initialColumns: Column[] = [
  {
    id: 'new',
    title: 'Новый',
    deals: [
      {
        id: 'deal-1',
        title: 'ООО Меридиан',
        amount: 112000,
        status: 'В работе',
        avatarColor: '#FF6B6B',
        columnId: 'new',
        orderNumber: '#58998179',
        customer: 'Иван Петров',
        createdDate: '2025-01-10',
        movedDate: '2025-01-14',
        description: 'Требуется консультация по внедрению CRM системы',
        assignee: 'Менеджер',
        type: 'Card'
      },
      {
        id: 'deal-2',
        title: 'ООО Олимп',
        amount: 68000,
        status: 'В работе',
        avatarColor: '#4ECDC4',
        columnId: 'new'
      },
      {
        id: 'deal-3',
        title: 'ИП Слинцын',
        amount: 75000,
        status: 'В работе',
        avatarColor: '#95E1D3',
        columnId: 'new'
      },
      {
        id: 'deal-4',
        title: 'ИП Орлов',
        amount: 107000,
        status: 'В работе',
        avatarColor: '#F38181',
        columnId: 'new'
      }
    ]
  },
  {
    id: 'qualification',
    title: 'Квалификация',
    deals: [
      {
        id: 'deal-5',
        title: 'ООО Титан',
        amount: 89000,
        status: 'В работе',
        avatarColor: '#AA96DA',
        columnId: 'qualification'
      }
    ]
  },
  {
    id: 'proposal',
    title: 'Предложение',
    deals: [
      {
        id: 'deal-6',
        title: 'ИП Соколов',
        amount: 101000,
        status: 'В работе',
        avatarColor: '#FCBAD3',
        columnId: 'proposal',
        orderNumber: '#58998178',
        customer: 'Андрей Соколов',
        createdDate: '2024-12-15',
        movedDate: '2025-01-13',
        description: '',
        assignee: 'Ответственный',
        type: 'Card'
      },
      {
        id: 'deal-7',
        title: 'ИП Леонов',
        amount: 125000,
        status: 'В работе',
        avatarColor: '#FFFFD2',
        columnId: 'proposal',
        orderNumber: '#58998180',
        customer: 'Дмитрий Леонов',
        createdDate: '2025-01-05',
        movedDate: '2025-01-12',
        description: 'Подписание договора на поставку оборудования',
        assignee: 'Менеджер по продажам',
        type: 'Card'
      }
    ]
  },
  {
    id: 'negotiation',
    title: 'Переговоры',
    deals: [
      {
        id: 'deal-8',
        title: 'ИП Жуков',
        amount: 93000,
        status: 'В работе',
        avatarColor: '#A8D8EA',
        columnId: 'negotiation'
      }
    ]
  },
  {
    id: 'paid',
    title: 'Оплачено',
    deals: [
      {
        id: 'deal-9',
        title: 'ООО Северяне',
        amount: 142000,
        status: 'Выиграно',
        avatarColor: '#FFAAA5',
        columnId: 'paid'
      }
    ]
  },
  {
    id: 'lost',
    title: 'Потеряно',
    deals: [
      {
        id: 'deal-10',
        title: 'ИП Волков',
        amount: 88000,
        status: 'Потеряно',
        avatarColor: '#FFD3B6',
        columnId: 'lost'
      }
    ]
  }
];
