<?php

namespace App\Http\Controllers;

use App\Support\Catalog;
use Illuminate\Http\Request;
use Rimsovannara\PayWay\Facades\PayWay;

/**
 * Storefront + ABA PayWay KHQR checkout, using the payway-laravel SDK.
 *
 * Flow:
 *   GET  /                 → shop (menu + cart)
 *   POST /checkout         → re-price cart server-side, generate a KHQR to scan
 *   POST /payment/callback → PayWay calls this server-to-server; confirm via API
 *   GET  /payment/success  → customer lands here after paying
 */
class ShopController extends Controller
{
    public function index()
    {
        return view('shop.index', ['products' => Catalog::all()]);
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|string',
            'cart.*.qty' => 'required|integer|min:1|max:99',
            'customer.firstname' => 'required|string',
            'customer.lastname' => 'required|string',
            'customer.email' => 'required|email',
        ]);

        // Never trust the client's total — recalculate from server-side prices.
        $amount = 0.0;
        $items = [];
        foreach ($validated['cart'] as $line) {
            $product = Catalog::find($line['id']);
            if (! $product) {
                continue;
            }
            $qty = (int) $line['qty'];
            $amount += $product['price'] * $qty;
            $items[] = ['name' => $product['name'], 'quantity' => $qty, 'price' => $product['price']];
        }
        $amount = round($amount, 2);

        abort_if($amount <= 0, 422, 'Cart is empty.');

        $tranId = 'KHQR-'.now()->timestamp;
        $customer = $validated['customer'];

        // generateQR returns a ready-to-display KHQR image plus a deep link.
        $qr = PayWay::generateQR([
            'tran_id' => $tranId,
            'amount' => $amount,
            'currency' => 'USD',
            'firstname' => $customer['firstname'],
            'lastname' => $customer['lastname'],
            'email' => $customer['email'],
            'items' => $items,
            'return_url' => route('payment.callback'),
            'continue_success_url' => route('payment.success', ['tran' => $tranId]),
        ]);

        return view('shop.qr', [
            'qr' => $qr,
            'amount' => $amount,
            'tranId' => $tranId,
        ]);
    }

    public function callback(Request $request)
    {
        // Verify against PayWay rather than trusting the POST body.
        $result = PayWay::checkTransaction($request->input('tran_id'));

        if (($result['data']['payment_status'] ?? null) === 'APPROVED') {
            // Order::where('transaction_id', $request->input('tran_id'))->update(['status' => 'paid']);
        }

        return response('ok', 200);
    }

    public function success(Request $request)
    {
        return view('shop.success', ['tran' => $request->query('tran')]);
    }
}
