<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class WebPushNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $title;
    public $message;
    public $actionUrl;

    public function __construct($title, $message, $actionUrl = '/')
    {
        $this->title = $title;
        $this->message = $message;
        $this->actionUrl = $actionUrl;
    }

    public function via($notifiable)
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title($this->title)
            ->body($this->message)
            ->icon('/pwa-icons/icon-192.png')
            ->data(['url' => $this->actionUrl]);
    }
}
