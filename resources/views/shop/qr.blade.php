@extends('layout')
@section('title', 'Scan to pay — Sang Café')

@section('content')
<main class="wrap" style="max-width:460px;padding-block:48px">
    <div class="modal" style="position:static;transform:none;width:auto;margin:0 auto">
        <div class="pay-step">
            <h3>Scan to pay</h3>
            <p class="muted small">Open your banking app → scan → confirm.</p>
            <div class="khqr-card">
                <div class="khqr-top"><span class="khqr-brand">KHQR</span><span class="khqr-amount">${{ number_format($amount, 2) }}</span></div>
                <div class="qr-box">
                    @if (!empty($qr['qrImage']))
                        <img src="{{ $qr['qrImage'] }}" alt="KHQR code" width="200" height="200">
                    @else
                        <p class="muted">QR unavailable — check PayWay credentials.</p>
                    @endif
                </div>
                <p class="khqr-merchant">SANG CAFE CO., LTD</p>
                <p class="muted small" style="text-align:center">{{ $tranId }}</p>
            </div>
            @if (!empty($qr['abapay_deeplink']))
                <a href="{{ $qr['abapay_deeplink'] }}" class="btn btn-primary btn-block">Open in ABA app</a>
            @endif
            <p class="muted small center" style="margin-top:14px">Waiting for payment… this page confirms via PayWay's Check Transaction API.</p>
        </div>
    </div>
</main>
@endsection
