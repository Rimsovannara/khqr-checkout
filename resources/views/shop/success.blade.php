@extends('layout')
@section('title', 'Thank you — Sang Café')

@section('content')
<main class="wrap" style="max-width:460px;padding-block:64px">
    <div class="pay-step center">
        <div class="check">✓</div>
        <h3>Payment received</h3>
        <p class="muted">Order <span class="mono">{{ $tran }}</span></p>
        <a href="{{ route('shop') }}" class="btn btn-primary btn-block" style="margin-top:16px">Back to shop</a>
    </div>
</main>
@endsection
