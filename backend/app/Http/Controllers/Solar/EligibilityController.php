<?php

namespace App\Http\Controllers\Solar;

use App\Http\Controllers\Controller;

class EligibilityController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'criteria' => [
                    [
                        'id' => 'house_ownership',
                        'question' => 'Do you own the house where the solar panels will be installed?',
                        'required' => true,
                    ],
                    [
                        'id' => 'electricity_connection',
                        'question' => 'Do you have an active electricity connection in your name?',
                        'required' => true,
                    ],
                    [
                        'id' => 'bank_account',
                        'question' => 'Do you have a valid Aadhaar linked bank account?',
                        'required' => true,
                    ],
                    [
                        'id' => 'previous_subsidy',
                        'question' => 'Have you availed any solar subsidy before?',
                        'required' => false,
                        'expected_answer' => 'no',
                    ],
                ],
                'subsidy_slabs' => [
                    '3kw' => 94800,
                    'above_3kw' => 94800,
                ],
            ],
        ]);
    }
}
