import React, { FC, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import Icon from '../../components/icon/Icon';
import Moments from '../../helpers/Moment';
import {
  useAdminNotifications,
  useAcknowledgeNotification,
  useMarkAllNotificationsRead,
  AdminNotification,
} from '../../api/notification.api';
import { parseAlertBody } from '../../helpers/parseAlertBody';
import noNotification from '../../assets/Lottie/notification.json';
import s from '../../styles/components/Notifications.module.css';

const Notifications: FC<any> = ({ isOpen, setIsOpen }) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('unread');
  const [limit, setLimit] = useState(10);
  const [visible, setVisible] = useState(false);

  /* animate in/out */
  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [isOpen]);

  /* close on outside click */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, setIsOpen]);

  const { data, isLoading } = useAdminNotifications({
    acknowledged: activeTab === 'all' ? undefined : activeTab === 'read',
    limit,
    offset: 0,
  });

  const notificationsData = data?.results || [];
  const totalCount = data?.count || 0;

  const ackMutation = useAcknowledgeNotification();
  const markAllMutation = useMarkAllNotificationsRead();

  const handleClose = () => setIsOpen(false);
  const handleMarkAll = async () => { await markAllMutation.mutateAsync(); };
  const handleLoadMore = () => setLimit(prev => prev + 10);
  const handleAcknowledge = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await ackMutation.mutateAsync(id);
  };

  const navigate = useNavigate();
  const handleNotificationClick = (n: AdminNotification) => {
    // Parse the alert's original backend ID from the body string
    const parsed = parseAlertBody(n.body || '');
    const alertId = parsed.alertId ? parseInt(parsed.alertId, 10) : undefined;
    handleClose();
    navigate('/halo/alerts/history', {
      state: { highlightAlertId: alertId, notificationId: n.id },
    });
  };

  const getConfig = (n: AdminNotification) => {
    const map: Record<string, { icon: string; color: string }> = {
      TASK: { icon: 'Assignment', color: '#9333ea' },
      ALERT: { icon: 'Report', color: '#ef4444' },
      INFO: { icon: 'Info', color: '#0ea5e9' },
      WARNING: { icon: 'Warning', color: '#f59e0b' },
      ERROR: { icon: 'Error', color: '#ef4444' },
      SUCCESS: { icon: 'CheckCircle', color: '#10b981' },
    };
    return map[n.type] || map[n.severity] || map.INFO;
  };

  const groupNotifications = () => {
    const groups: Record<string, AdminNotification[]> = {
      Today: [], Yesterday: [], Earlier: [],
    };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    notificationsData.forEach(n => {
      const d = new Date(n.created_time); d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) groups.Today.push(n);
      else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    });
    return groups;
  };

  const grouped = groupNotifications();
  const hasUnread = notificationsData.some(n => !n.is_acknowledged_by_user);

  if (!isOpen && !visible) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`${s.backdrop} ${visible ? s.backdropVisible : ''}`}
        onClick={handleClose}
      />

      {/* ── Drawer ── */}
      <div
        ref={drawerRef}
        className={`${s.drawer} ${visible ? s.drawerVisible : ''}`}
      >
        {/* ── Header ── */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.iconWrap}>
              <Icon icon="Notifications" />
              {hasUnread && <span className={s.badge} />}
            </div>
            <div>
              <div className={s.title}>Notifications</div>
              {totalCount > 0 && (
                <div className={s.meta}>
                  {notificationsData.length} of {totalCount} · {activeTab}
                </div>
              )}
            </div>
          </div>

          <div className={s.headerActions}>
            {hasUnread && (
              <button className={s.btnMarkAll} onClick={handleMarkAll}>
                <Icon icon="DoneAll" style={{ fontSize: 13 }} />
                Mark all read
              </button>
            )}
            <button className={s.btnClose} onClick={handleClose}>
              <Icon icon="Close" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={s.tabs}>
          {(['unread', 'read', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${s.tab} ${activeTab === tab ? s.tabActive : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className={s.body}>
          {isLoading && notificationsData.length === 0 ? (
            <div className={s.empty}>
              <div className={s.spinner} />
            </div>

          ) : notificationsData.length === 0 ? (
            <div className={s.empty}>
              <Player autoplay loop src={noNotification} style={{ height: 90 }} />
              <p className={s.emptyText}>All caught up!</p>
            </div>

          ) : (
            <>
              {Object.entries(grouped).map(([label, list]) => {
                if (!list.length) return null;
                return (
                  <div key={label}>
                    <div className={s.groupLabel}>
                      <span className={s.groupLabelText}>{label}</span>
                      <div className={s.groupLabelLine} />
                    </div>

                    {list.map(n => {
                      const cfg = getConfig(n);
                      const unread = !n.is_acknowledged_by_user;
                      return (
                        <div
                          key={n.id}
                          className={`${s.item} ${unread ? s.itemUnread : ''}`}
                          onClick={() => handleNotificationClick(n)}
                          style={{ cursor: 'pointer' }}
                        >
                          {unread && (
                            <div
                              className={s.accentBar}
                              style={{
                                background: cfg.color,
                                boxShadow: `0 0 8px ${cfg.color}66`,
                              }}
                            />
                          )}

                          <div
                            className={s.itemIconWrap}
                            style={{
                              boxShadow: `0 2px 8px rgba(0,0,0,0.07), 0 0 12px ${cfg.color}28, inset 0 1px 1px rgba(255,255,255,1)`,
                            }}
                          >
                            <Icon icon={cfg.icon} style={{ fontSize: 18, color: cfg.color }} />
                          </div>

                          <div className={s.itemContent}>
                            <div className={s.itemRow}>
                              <div className={s.itemTags}>
                                <span
                                  className={s.typeBadge}
                                  style={{ color: cfg.color, borderColor: `${cfg.color}40` }}
                                >
                                  {n.type}
                                </span>
                                {n.severity !== n.type && (
                                  <span className={s.severityLabel}>
                                    {n.severity.toLowerCase()}
                                  </span>
                                )}
                              </div>
                              <div className={s.timeWrap}>
                                <div className={s.time}>
                                  {n.created_time ? Moments(n.created_time, 'time') : 'Just now'}
                                </div>
                                <div className={s.relTime}>
                                  {n.created_time ? Moments(n.created_time, 'relativetime') : ''}
                                </div>
                              </div>
                            </div>

                            <div className={s.itemTitle}>{n.title}</div>
                            {/* ── Structured body ── */}
                            {(() => {
                              const parsed = parseAlertBody(n.body || '');
                              const accentColor = cfg.color;

                              const chip = (label: string, val: string) => (
                                <span key={label} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 3,
                                  background: `${accentColor}0f`,
                                  border: `1px solid ${accentColor}28`,
                                  borderRadius: 4, padding: '1px 6px', marginRight: 4, marginBottom: 3,
                                  fontSize: '0.68rem',
                                }}>
                                  <span style={{ opacity: 0.5, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.5px' }}>{label}</span>
                                  <span style={{ fontWeight: 600, color: accentColor }}>{val}</span>
                                </span>
                              );

                              // If unparseable, show raw body up to 120 chars
                              if (!parsed.area && !parsed.sensor && !parsed.value) {
                                return (
                                  <div className={s.itemBody}>
                                    {(n.body || '').slice(0, 120)}{(n.body || '').length > 120 ? '…' : ''}
                                  </div>
                                );
                              }

                              return (
                                <div className={s.itemBody} style={{ paddingBottom: 2 }}>
                                  {/* Location */}
                                  {(parsed.area || parsed.sensor) && (
                                    <div style={{ marginBottom: 4 }}>
                                      {parsed.area && chip('Area', parsed.area)}
                                      {parsed.sensor && chip('Sensor', parsed.sensor)}
                                    </div>
                                  )}
                                  {/* Event */}
                                  {(parsed.eventSource || parsed.sourceType) && (
                                    <div style={{ marginBottom: 4 }}>
                                      {parsed.eventSource && chip('Event', parsed.eventSource)}
                                      {parsed.sourceType && chip('Source', parsed.sourceType)}
                                      {parsed.unit && chip('Unit', parsed.unit)}
                                    </div>
                                  )}
                                  {/* Value vs Limit */}
                                  {(parsed.value || parsed.threshold) && (
                                    <div style={{
                                      display: 'flex', gap: 10, alignItems: 'center',
                                      padding: '3px 8px',
                                      background: `${accentColor}12`,
                                      borderLeft: `3px solid ${accentColor}`,
                                      borderRadius: '0 4px 4px 0',
                                      fontSize: '0.72rem',
                                    }}>
                                      {parsed.value && (
                                        <span>
                                          <span style={{ opacity: 0.5, fontSize: '0.62rem', textTransform: 'uppercase' }}>Value </span>
                                          <strong style={{ color: accentColor }}>{parsed.value}</strong>
                                        </span>
                                      )}
                                      {parsed.value && parsed.threshold && (
                                        <span style={{ opacity: 0.3 }}>vs</span>
                                      )}
                                      {parsed.threshold && (
                                        <span>
                                          <span style={{ opacity: 0.5, fontSize: '0.62rem', textTransform: 'uppercase' }}>Limit </span>
                                          <strong>{parsed.threshold}</strong>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div className={s.itemFooter}>
                              {!unread ? (
                                activeTab !== 'read' && (
                                  <span className={s.ackBadge}>
                                    <Icon icon="CheckCircle" style={{ fontSize: 12 }} />
                                    Acknowledged
                                  </span>
                                )
                              ) : (
                                <button
                                  className={s.btnAck}
                                  onClick={(e: any) => handleAcknowledge(e, n.id)}
                                  disabled={ackMutation.isPending && ackMutation.variables === n.id}
                                >
                                  {ackMutation.isPending && ackMutation.variables === n.id ? (
                                    <div className={`${s.spinner} ${s.spinnerXs}`} />
                                  ) : (
                                    <Icon icon="Check" style={{ fontSize: 12 }} />
                                  )}
                                  Acknowledge
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {notificationsData.length < totalCount && (
                <div className={s.loadMoreWrap}>
                  <button
                    className={s.btnLoadMore}
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <div className={`${s.spinner} ${s.spinnerSm}`} />
                      : <Icon icon="ExpandMore" style={{ fontSize: 16 }} />
                    }
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;