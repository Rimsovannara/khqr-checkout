<?php

use App\Http\Controllers\ShopController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

Route::get('/', [ShopController::class, 'index'])->name('shop');
Route::post('/checkout', [ShopController::class, 'checkout'])->name('checkout');
Route::get('/payment/success', [ShopController::class, 'success'])->name('payment.success');

// PayWay posts here server-to-server; it cannot send a CSRF token.
Route::post('/payment/callback', [ShopController::class, 'callback'])
    ->name('payment.callback')
    ->withoutMiddleware([VerifyCsrfToken::class]);
