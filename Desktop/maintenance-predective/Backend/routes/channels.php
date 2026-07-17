<?php

use Illuminate\Support\Facades\Broadcast;

// Use Sanctum token auth for the /broadcasting/auth endpoint.
Broadcast::routes(['middleware' => ['auth:sanctum']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for real-time motor/sensor dashboard — any authenticated user may join.
Broadcast::channel('motors-dashboard', function ($user) {
    return (bool) $user;
});
