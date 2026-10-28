import React from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Video, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Phone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export const HowToApproveGuide: React.FC = () => {
  const { agencyConfig } = useApp();

  const steps = [
    {
      num: '01',
      title: 'Visualize a Arte ou Assista ao Vídeo',
      desc: 'Para imagens e carrosséis, você pode folhear cada lâmina. Para vídeos compartilhados pelo Google Drive, basta apertar o Play no player integrado — sem necessidade de fazer download do arquivo.',
      icon: Video,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      num: '02',
      title: 'Leia a Legenda e Confira a Data',
      desc: 'Revise o texto de apoio, chamadas para ação (CTA), links e hashtags planejadas. Logo acima da postagem, verifique a data e o horário programados para publicação nas redes sociais.',
      icon: Calendar,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      num: '03',
      title: 'Aprove com 1 Clique ou Peça Ajustes',
      desc: 'Se o material estiver perfeito, clique no botão verde "Aprovar Post". O status mudará imediatamente e nosso gerente de contas receberá uma notificação instantânea para agendamento.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      num: '04',
      title: 'Solicite Alterações Pontuais',
      desc: 'Precisa mudar uma frase, cor ou imagem? Clique em "Pedir Ajuste" e digite as observações. O post ficará em "Em Alteração" e nossa equipe de design receberá o alerta com prioridade.',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      num: '05',
      title: 'Use o Chat Interno para Dúvidas',
      desc: 'Em cada postagem existe um botão de Chat exclusivo para alinhar referências, fazer perguntas e acompanhar o histórico de revisões entre você e nossa agência.',
      icon: MessageSquare,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/15 mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Guia Rápido de Aprovação
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Como revisar e aprovar seus conteúdos em segundos
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Desenvolvemos este portal exclusivo para que você tenha autonomia total, rapidez e transparência no fluxo de postagens da sua marca.
          </p>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map(step => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow flex items-start gap-4"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${step.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-bold text-slate-400">{step.num}.</span>
                  <h3 className="font-semibold text-slate-900 text-sm">{step.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}

        {/* Support Card */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
            <Phone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-emerald-950 text-sm mb-1">Dúvidas Urgentes?</h3>
            <p className="text-xs text-emerald-800 leading-relaxed mb-3">
              Fale diretamente com seu gerente de contas da agência no WhatsApp.
            </p>
            {agencyConfig.accountManagerPhone && (
              <a
                href={buildWhatsAppUrl(
                  agencyConfig.accountManagerPhone,
                  `Olá ${agencyConfig.accountManagerName}, estou revisando os conteúdos no portal e tenho uma dúvida rápida.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <span>Chamar no WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
