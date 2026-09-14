<?php

namespace App\Support;

/**
 * Product catalog. In a real store this is an Eloquent model / database table;
 * kept inline here so the demo runs without migrations.
 */
class Catalog
{
    /** @return array<int, array{id:string,name:string,khmer:string,price:float,emoji:string,tag:string}> */
    public static function all(): array
    {
        return [
            ['id' => 'kfe-01', 'name' => 'Iced Cambodian Coffee', 'khmer' => 'កាហ្វេទឹកកក', 'price' => 1.75, 'emoji' => '🧋', 'tag' => 'Bestseller'],
            ['id' => 'kfe-02', 'name' => 'Khmer Iced Tea',        'khmer' => 'តែទឹកកក',      'price' => 1.25, 'emoji' => '🍵', 'tag' => ''],
            ['id' => 'kfe-03', 'name' => 'Num Krok (12 pcs)',     'khmer' => 'នំក្រុក',       'price' => 2.50, 'emoji' => '🥟', 'tag' => ''],
            ['id' => 'kfe-04', 'name' => 'Fresh Coconut',         'khmer' => 'ដូងខ្ចី',       'price' => 2.00, 'emoji' => '🥥', 'tag' => ''],
            ['id' => 'kfe-05', 'name' => 'Mango Sticky Rice',     'khmer' => 'បាយដំណើបស្វាយ',  'price' => 3.00, 'emoji' => '🥭', 'tag' => 'Popular'],
            ['id' => 'kfe-06', 'name' => 'Palm Sugar Cake',       'khmer' => 'នំត្នោត',       'price' => 1.50, 'emoji' => '🍮', 'tag' => ''],
        ];
    }

    /** Look up a single product by id. */
    public static function find(string $id): ?array
    {
        foreach (self::all() as $p) {
            if ($p['id'] === $id) {
                return $p;
            }
        }

        return null;
    }
}
